import { useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Gamepad2, Wifi, Zap } from 'lucide-react';
import type { NetworkTier } from './app-types';

type GameParticle = {
  x: number;
  y: number;
  speed: number;
  size: number;
};

type GameEnemy = {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
};

type CloudGameState = {
  shipX: number;
  targetX: number;
  particles: GameParticle[];
  enemies: GameEnemy[];
  lastRender: number;
  jitterPauseUntil: number;
  score: number;
  isDead: boolean;
  deathTime: number;
};

export function CloudGame({ networkTier }: { networkTier: NetworkTier }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const gameState = useRef<CloudGameState>({
    shipX: 150,
    targetX: 150,
    particles: Array.from({ length: 40 }, () => ({
      x: Math.random() * 300,
      y: Math.random() * 200,
      speed: Math.random() * 2 + 1,
      size: Math.random() * 2 + 1,
    })),
    enemies: [],
    lastRender: 0,
    jitterPauseUntil: 0,
    score: 0,
    isDead: false,
    deathTime: 0,
  });

  const moveShip = (direction: 'left' | 'right') => {
    if (gameState.current.isDead) {
      return;
    }

    const latency = networkTier === 'Degraded' ? 800 : networkTier === '5G' ? 80 : 10;

    window.setTimeout(() => {
      const state = gameState.current;
      if (direction === 'left') {
        state.targetX = Math.max(20, state.targetX - 40);
      } else {
        state.targetX = Math.min(280, state.targetX + 40);
      }
    }, latency);
  };

  const gameLoop = useCallback((timestamp: number) => {
    const state = gameState.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) {
      return;
    }

    const is6G = networkTier === '6G';
    const isDegraded = networkTier === 'Degraded';
    const targetFPS = is6G ? 60 : isDegraded ? 12 : 30;
    const frameInterval = 1000 / targetFPS;

    if (isDegraded && Math.random() < 0.05 && timestamp > state.jitterPauseUntil) {
      state.jitterPauseUntil = timestamp + 500;
    }

    if (timestamp < state.jitterPauseUntil) {
      requestRef.current = window.requestAnimationFrame(gameLoop);
      return;
    }

    if (timestamp - state.lastRender >= frameInterval) {
      if (state.isDead && timestamp - state.deathTime > 2000) {
        state.isDead = false;
        state.enemies = [];
        state.score = 0;
        state.shipX = 150;
        state.targetX = 150;
      }

      if (!state.isDead) {
        const moveSpeed = isDegraded ? 0.9 : 0.2;
        state.shipX += (state.targetX - state.shipX) * moveSpeed;

        const speedMultiplier = is6G ? 3 : isDegraded ? 0.5 : 1.5;
        state.particles.forEach((particle) => {
          particle.y += particle.speed * speedMultiplier;
          if (particle.y > 200) {
            particle.y = 0;
            particle.x = Math.random() * 300;
          }
        });

        if (Math.random() < (is6G ? 0.05 : 0.03)) {
          state.enemies.push({
            x: Math.random() * 260 + 20,
            y: -20,
            speed: (Math.random() * 2 + 2) * speedMultiplier,
            width: 20,
            height: 20,
          });
        }

        for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
          const enemy = state.enemies[index];
          enemy.y += enemy.speed;

          if (
            enemy.y + enemy.height > 145 &&
            enemy.y < 170 &&
            enemy.x + enemy.width > state.shipX - 15 &&
            enemy.x < state.shipX + 15
          ) {
            state.isDead = true;
            state.deathTime = timestamp;
          }

          if (enemy.y > 220) {
            state.enemies.splice(index, 1);
            state.score += is6G ? 2 : 1;
          }
        }
      }

      ctx.save();

      if (isDegraded && Math.random() < 0.1) {
        ctx.translate(Math.random() * 10 - 5, 0);
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = is6G ? '#a855f7' : '#ffffff';
      state.particles.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!state.isDead) {
        ctx.fillStyle = '#ef4444';
        state.enemies.forEach((enemy) => {
          ctx.beginPath();
          ctx.rect(enemy.x, enemy.y, enemy.width, enemy.height);
          ctx.fill();
        });

        ctx.save();
        ctx.translate(state.shipX, 160);

        if (is6G) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#06b6d4';
        }

        ctx.fillStyle = is6G ? '#06b6d4' : '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(15, 10);
        ctx.lineTo(-15, 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = is6G ? '#a855f7' : '#fb923c';
        ctx.beginPath();
        ctx.moveTo(-8, 10);
        ctx.lineTo(8, 10);
        ctx.lineTo(0, 10 + Math.random() * 15 + (is6G ? 10 : 0));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED!', 150, 100);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#fb923c';
        ctx.fillText('Respawning...', 150, 120);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = isDegraded ? '#ef4444' : is6G ? '#22c55e' : '#eab308';
      ctx.font = '10px Arial';
      ctx.fillText(is6G ? 'Ping: 2ms' : isDegraded ? 'Ping: 850ms' : 'Ping: 45ms', 10, 20);
      ctx.fillText(is6G ? 'Packet Loss: 0%' : isDegraded ? 'Packet Loss: 24%' : 'Packet Loss: 0.1%', 10, 32);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(is6G ? 'Bitrate: 25 Mbps' : isDegraded ? 'Bitrate: 0.8 Mbps' : 'Bitrate: 8 Mbps', 10, 44);
      ctx.fillText(`Score: ${state.score}`, 240, 20);

      ctx.restore();
      state.lastRender = timestamp;
    }

    requestRef.current = window.requestAnimationFrame(gameLoop);
  }, [networkTier]);

  useEffect(() => {
    requestRef.current = window.requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current !== null) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div className="group relative flex w-full flex-col bg-gray-900">
      <canvas
        ref={canvasRef}
        width="300"
        height="200"
        data-testid="cloud-game-canvas"
        className={`aspect-video w-full border-b-2 object-cover ${
          networkTier === '6G' ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-gray-800'
        }`}
        style={{
          filter: networkTier === 'Degraded' ? 'contrast(1.2) blur(1px) saturate(0.5)' : 'none',
          imageRendering: networkTier === 'Degraded' ? 'pixelated' : 'auto',
        }}
      />

      <div className="absolute right-2 top-2 z-20 flex space-x-1">
        <span className="flex items-center rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <Gamepad2 size={10} className="mr-1" /> CLOUD
        </span>
        {networkTier === '6G' && (
          <span className="flex items-center rounded bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(147,51,234,0.8)]">
            <Zap size={10} className="mr-0.5" /> 6G SLICE
          </span>
        )}
      </div>

      {networkTier === 'Degraded' && (
        <div className="pointer-events-none absolute inset-0 top-0 z-10 flex h-[200px] flex-col items-center justify-center bg-red-900/30">
          <Wifi className="mb-2 animate-pulse text-red-500/80" size={48} />
          <span className="rounded bg-black/50 px-2 py-1 text-xs font-bold text-red-400">STREAM DEGRADED</span>
        </div>
      )}

      <div className="flex w-full items-center justify-between bg-gray-800 p-4 px-8 pb-6">
        <button
          onPointerDown={() => moveShip('left')}
          className="flex h-14 w-14 touch-none items-center justify-center rounded-full border border-gray-600 bg-gray-700 text-white shadow-lg transition-all active:scale-95 active:bg-gray-600"
          aria-label="Move ship left"
        >
          <ArrowLeft size={28} />
        </button>

        <div className="text-center">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">Status</div>
          <div
            className={`text-sm font-bold ${
              networkTier === '6G'
                ? 'text-cyan-400'
                : networkTier === 'Degraded'
                  ? 'animate-pulse text-red-400'
                  : 'text-blue-400'
            }`}
          >
            {networkTier === '6G' ? 'HYPERDRIVE' : networkTier === 'Degraded' ? 'CONNECTION UNSTABLE' : 'ONLINE'}
          </div>
        </div>

        <button
          onPointerDown={() => moveShip('right')}
          className="flex h-14 w-14 touch-none items-center justify-center rounded-full border border-gray-600 bg-gray-700 text-white shadow-lg transition-all active:scale-95 active:bg-gray-600"
          aria-label="Move ship right"
        >
          <ArrowRight size={28} />
        </button>
      </div>
    </div>
  );
}
