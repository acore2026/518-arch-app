import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Battery,
  CheckCircle2,
  Cpu,
  Crosshair,
  Gamepad2,
  Loader2,
  Pause,
  Play,
  Settings,
  Signal,
  Wifi,
  Zap,
} from 'lucide-react';

type NetworkTier = '5G' | 'Degraded' | '6G';
type Experience = 'streaming' | 'gaming' | 'intent';
type IntentCategory = 'buffering' | 'latency' | 'gaming' | 'slice' | 'unknown';
type IntentRole = 'user' | 'network';
type IntentStatus = 'sent' | 'processing' | 'complete';

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

type IntentMessage = {
  id: string;
  role: IntentRole;
  title?: string;
  text: string;
  timestamp: string;
  status: IntentStatus;
  category?: IntentCategory;
};

type StubIntentResult = {
  category: IntentCategory;
  title: string;
  text: string;
};

const SUGGESTED_INTENT = 'Fix my buffering for this stream.';

function formatTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStubIntentResult(intentText: string): StubIntentResult {
  const normalized = intentText.toLowerCase();

  if (
    normalized.includes('buffer') ||
    normalized.includes('stream') ||
    normalized.includes('video') ||
    normalized.includes('playback')
  ) {
    return {
      category: 'buffering',
      title: 'Video policy ACK',
      text: 'Stub core network would allocate a premium streaming policy with higher bitrate and lower-loss routing.',
    };
  }

  if (
    normalized.includes('lag') ||
    normalized.includes('latency') ||
    normalized.includes('ping') ||
    normalized.includes('delay')
  ) {
    return {
      category: 'latency',
      title: 'Latency policy ACK',
      text: 'Stub core network would favor a low-latency path and tighten retransmission targets for this session.',
    };
  }

  if (
    normalized.includes('game') ||
    normalized.includes('gaming') ||
    normalized.includes('fps') ||
    normalized.includes('input')
  ) {
    return {
      category: 'gaming',
      title: 'Gaming edge ACK',
      text: 'Stub core network would pin the session to an edge-friendly routing profile optimized for cloud gaming.',
    };
  }

  if (
    normalized.includes('slice') ||
    normalized.includes('qos') ||
    normalized.includes('priority') ||
    normalized.includes('bandwidth')
  ) {
    return {
      category: 'slice',
      title: 'Slice orchestration ACK',
      text: 'Stub core network would provision a higher-priority QoS profile and queue slice orchestration for review.',
    };
  }

  return {
    category: 'unknown',
    title: 'Fallback ACK',
    text: 'Stub core network received the intent but could not map it to a known policy template.',
  };
}

function CloudGame({ networkTier }: { networkTier: NetworkTier }) {
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
    <div className="relative flex w-full flex-col bg-gray-900 group">
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

      <div className="absolute top-2 right-2 z-20 flex space-x-1">
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
        <div className="pointer-events-none absolute inset-0 top-0 flex h-[200px] flex-col items-center justify-center bg-red-900/30 z-10">
          <Wifi className="mb-2 animate-pulse text-red-500/80" size={48} />
          <span className="rounded bg-black/50 px-2 py-1 text-xs font-bold text-red-400">STREAM DEGRADED</span>
        </div>
      )}

      <div className="flex w-full items-center justify-between bg-gray-800 p-4 px-8 pb-6">
        <button
          onPointerDown={() => moveShip('left')}
          className="touch-none flex h-14 w-14 items-center justify-center rounded-full border border-gray-600 bg-gray-700 text-white shadow-lg transition-all active:scale-95 active:bg-gray-600"
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
          className="touch-none flex h-14 w-14 items-center justify-center rounded-full border border-gray-600 bg-gray-700 text-white shadow-lg transition-all active:scale-95 active:bg-gray-600"
          aria-label="Move ship right"
        >
          <ArrowRight size={28} />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [experience, setExperience] = useState<Experience>('streaming');
  const [showExperienceMenu, setShowExperienceMenu] = useState(false);
  const [networkTier, setNetworkTier] = useState<NetworkTier>('5G');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalExpanded, setModalExpanded] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [intentDraft, setIntentDraft] = useState('');
  const [isIntentSending, setIsIntentSending] = useState(false);
  const [intentMessages, setIntentMessages] = useState<IntentMessage[]>(() => [
    {
      id: 'network-0',
      role: 'network',
      title: 'Stub Core Network Ready',
      text: 'Send a natural-language request directly to the core network. This tab is stubbed and does not change the demo state.',
      timestamp: formatTimestamp(),
      status: 'complete',
      category: 'unknown',
    },
  ]);

  const degradationTimer = useRef<number | null>(null);
  const upgradeTimer = useRef<number | null>(null);
  const successTimer = useRef<number | null>(null);
  const intentReplyTimer = useRef<number | null>(null);
  const intentMessageId = useRef(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isStreaming = experience === 'streaming';
  const isGaming = experience === 'gaming';
  const isIntent = experience === 'intent';

  const clearNetworkTimers = () => {
    if (degradationTimer.current !== null) {
      window.clearTimeout(degradationTimer.current);
      degradationTimer.current = null;
    }
    if (upgradeTimer.current !== null) {
      window.clearTimeout(upgradeTimer.current);
      upgradeTimer.current = null;
    }
    if (successTimer.current !== null) {
      window.clearTimeout(successTimer.current);
      successTimer.current = null;
    }
  };

  const nextIntentMessageId = () => `intent-${intentMessageId.current++}`;

  const resetNetwork = () => {
    clearNetworkTimers();
    setNetworkTier('5G');
    setShowModal(false);
    setModalExpanded(false);
    setIsUpgrading(false);
    setUpgradeSuccess(false);
    setIsPlaying(true);
  };

  const handleExperienceChange = (nextExperience: Experience) => {
    if (nextExperience === experience) {
      setShowExperienceMenu(false);
      return;
    }
    setExperience(nextExperience);
    setShowExperienceMenu(false);
    resetNetwork();
  };

  const triggerDegradation = () => {
    clearNetworkTimers();
    setNetworkTier('Degraded');
    setShowModal(false);
    setModalExpanded(false);
    setIsUpgrading(false);
    setUpgradeSuccess(false);

    degradationTimer.current = window.setTimeout(() => {
      setShowModal(true);
      setModalExpanded(false);
    }, isGaming ? 4000 : 3000);
  };

  const handleUpgrade = () => {
    setIsUpgrading(true);

    upgradeTimer.current = window.setTimeout(() => {
      setIsUpgrading(false);
      setUpgradeSuccess(true);

      successTimer.current = window.setTimeout(() => {
        setNetworkTier('6G');
        setShowModal(false);
        setModalExpanded(false);
        setUpgradeSuccess(false);
      }, 1500);
    }, 2000);
  };

  const submitIntent = (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isIntentSending) {
      return;
    }

    const pendingId = nextIntentMessageId();

    setIntentMessages((messages) => [
      ...messages,
      {
        id: nextIntentMessageId(),
        role: 'user',
        text: trimmedInput,
        timestamp: formatTimestamp(),
        status: 'sent',
      },
      {
        id: pendingId,
        role: 'network',
        title: 'Processing Intent',
        text: 'Stub core network is evaluating the request.',
        timestamp: formatTimestamp(),
        status: 'processing',
      },
    ]);

    setIntentDraft('');
    setIsIntentSending(true);

    intentReplyTimer.current = window.setTimeout(() => {
      const stubResult = getStubIntentResult(trimmedInput);

      setIntentMessages((messages) =>
        messages.map((message) =>
          message.id === pendingId
            ? {
                ...message,
                title: stubResult.title,
                text: stubResult.text,
                timestamp: formatTimestamp(),
                status: 'complete',
                category: stubResult.category,
              }
            : message
        )
      );
      setIsIntentSending(false);
      intentReplyTimer.current = null;
    }, 700);
  };

  useEffect(() => {
    if (!isStreaming || !videoRef.current) {
      return;
    }

    if (networkTier === 'Degraded' || !isPlaying) {
      videoRef.current.pause();
      return;
    }

    videoRef.current.play().catch((error) => console.log('Autoplay blocked:', error));
  }, [isStreaming, isPlaying, networkTier]);

  useEffect(() => {
    return () => {
      clearNetworkTimers();
      if (intentReplyTimer.current !== null) {
        window.clearTimeout(intentReplyTimer.current);
      }
    };
  }, []);

  const appName = isStreaming ? 'StreamFlex' : isGaming ? 'CloudPlay' : 'IntentLink';
  const isNativeShell = Capacitor.isNativePlatform();
  const appAccent = isStreaming ? 'bg-blue-600' : isGaming ? 'bg-indigo-600' : 'bg-slate-900';
  const appShape = isStreaming ? 'rounded-full' : 'rounded-lg';
  const experienceButtonLabel = isStreaming ? 'Streaming' : isGaming ? 'Gaming' : 'Direct Intent';
  const modalAccent = isGaming
    ? {
        border: 'border-cyan-400',
        chip: 'bg-cyan-100 text-cyan-600',
        button: 'bg-cyan-500',
        gradient: 'from-cyan-500 to-blue-500',
        shadow: 'shadow-cyan-200 hover:shadow-cyan-300',
        price: 'text-cyan-600',
      }
    : {
        border: 'border-purple-200',
        chip: 'bg-purple-100 text-purple-600',
        button: 'bg-purple-600',
        gradient: 'from-purple-600 to-indigo-600',
        shadow: 'shadow-purple-200 hover:shadow-purple-300',
        price: 'text-purple-600',
      };

  const initialStateCopy = isIntent
    ? 'The intent tab is self-contained. Switch back to Streaming or Gaming to use the live network simulator.'
    : isGaming
      ? 'Cloud gameplay starts on standard 5G with acceptable responsiveness.'
      : 'The stream starts on standard 5G best-effort delivery and plays smoothly.';
  const congestionCopy = isIntent
    ? 'Congestion simulation is disabled while the direct intent console is active.'
    : isGaming
      ? 'Inject latency and packet loss. The session feels sluggish, then the 6G Edge offer appears after 4 seconds.'
      : 'Simulate tower congestion. Video quality collapses, buffering starts, then the upgrade offer appears after 3 seconds.';

  return (
    <div
      className={
        isNativeShell
          ? 'min-h-screen bg-white font-sans'
          : 'flex min-h-screen items-center justify-center bg-gray-50 p-8 font-sans'
      }
    >
      <div
        className={
          isNativeShell
            ? 'flex min-h-screen w-full flex-col bg-white'
            : 'flex w-full max-w-6xl flex-col items-start gap-12 lg:flex-row'
        }
      >
        <div className={isNativeShell ? 'w-full' : 'relative mx-auto lg:mx-0'}>
          <div
            className={
              isNativeShell
                ? 'relative w-full'
                : 'relative h-[750px] w-[350px] rounded-[3rem] border-4 border-gray-800 bg-black p-3 shadow-2xl'
            }
          >
            {!isNativeShell && (
              <div className="absolute inset-x-0 top-0 z-50 flex h-7 justify-center">
                <div className="h-6 w-32 rounded-b-2xl bg-black"></div>
              </div>
            )}

            <div
              className={
                isNativeShell
                  ? 'relative flex min-h-screen w-full flex-col overflow-hidden bg-white'
                  : 'relative flex h-full w-full flex-col overflow-hidden rounded-[2.5rem] bg-white'
              }
            >
              {!isNativeShell && (
                <div className="z-40 flex h-12 w-full items-end justify-between bg-white px-6 pb-2 text-xs font-medium">
                  <span>9:41</span>
                  <div className="flex items-center space-x-1.5">
                    <Signal size={14} className={networkTier === 'Degraded' ? 'text-red-500' : 'text-black'} />
                    {networkTier === '6G' ? (
                      <span className="text-[10px] font-bold text-purple-600">6G</span>
                    ) : (
                      <span className="text-[10px] font-bold">5G</span>
                    )}
                    <Battery size={16} />
                  </div>
                </div>
              )}

              <div className="relative z-30 flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div className="flex items-center space-x-2">
                  <div className={`flex h-8 w-8 items-center justify-center ${appShape} ${appAccent} font-bold text-white`}>
                    {isStreaming ? 'V' : isGaming ? <Gamepad2 size={18} /> : <Cpu size={18} />}
                  </div>
                  <h1 className="text-lg font-bold">{appName}</h1>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    data-testid="experience-menu-button"
                    aria-expanded={showExperienceMenu}
                    onClick={() => setShowExperienceMenu((open) => !open)}
                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <Settings size={14} className="text-slate-500" />
                    <span>{experienceButtonLabel}</span>
                  </button>

                  {showExperienceMenu && (
                    <div className="absolute right-0 top-[calc(100%+8px)] w-36 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <button
                        type="button"
                        data-testid="experience-option-streaming"
                        onClick={() => handleExperienceChange('streaming')}
                        className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                          isStreaming ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Streaming
                      </button>
                      <button
                        type="button"
                        data-testid="experience-option-gaming"
                        onClick={() => handleExperienceChange('gaming')}
                        className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                          isGaming ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Gaming
                      </button>
                      <button
                        type="button"
                        data-testid="experience-option-intent"
                        onClick={() => handleExperienceChange('intent')}
                        className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                          isIntent ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Direct Intent
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`flex-1 ${
                  isIntent ? 'overflow-hidden bg-slate-50' : isGaming ? 'overflow-y-auto bg-gray-50 pb-8' : 'overflow-y-auto pb-8'
                }`}
                onClick={() => {
                  if (showExperienceMenu) {
                    setShowExperienceMenu(false);
                  }
                }}
              >
                {isStreaming ? (
                  <>
                    <div className="relative aspect-video w-full overflow-hidden bg-black group">
                      <video
                        ref={videoRef}
                        data-testid="streaming-video"
                        src="https://vjs.zencdn.net/v/oceans.mp4"
                        poster="https://vjs.zencdn.net/v/oceans.png"
                        className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
                        style={{
                          filter: networkTier === 'Degraded' ? 'blur(6px) brightness(0.6)' : 'blur(0px) brightness(1)',
                        }}
                        autoPlay
                        loop
                        muted
                        playsInline
                        crossOrigin="anonymous"
                      />

                      <div className="absolute top-2 right-2 z-20 flex space-x-1">
                        <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          4K HDR
                        </span>
                        {networkTier === '6G' && (
                          <span className="flex items-center rounded bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(147,51,234,0.8)]">
                            <Zap size={10} className="mr-0.5" /> 6G BOOST
                          </span>
                        )}
                      </div>

                      {networkTier === 'Degraded' && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40">
                          <Loader2 className="mb-2 animate-spin text-white" size={32} />
                          <p className="text-xs font-medium text-white">Buffering...</p>
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="z-30 text-white transition-colors hover:text-blue-400"
                          aria-label={isPlaying && networkTier !== 'Degraded' ? 'Pause video' : 'Play video'}
                        >
                          {isPlaying && networkTier !== 'Degraded' ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <div className="mx-3 h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                          <div className="h-full w-1/3 bg-blue-500"></div>
                        </div>
                        <Settings size={18} className="text-white" />
                      </div>
                    </div>

                    <div className="p-5">
                      <h2 className="mb-1 text-xl font-bold">Elden Ring: Shadow of the Erdtree - 4K Gameplay</h2>
                      <p className="mb-4 text-sm text-gray-500">1.2M views - 2 hours ago</p>

                      <div className="mb-6 flex space-x-3">
                        <button className="flex flex-1 items-center justify-center rounded-full bg-gray-100 py-2 text-sm font-medium">
                          👍 145K
                        </button>
                        <button className="flex-1 rounded-full bg-gray-100 py-2 text-sm font-medium">Share</button>
                      </div>

                      <div
                        className={`rounded-xl border p-4 transition-colors duration-500 ${
                          networkTier === '6G'
                            ? 'border-purple-200 bg-purple-50'
                            : networkTier === 'Degraded'
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`rounded-full p-2 ${
                              networkTier === '6G'
                                ? 'bg-purple-100 text-purple-600'
                                : networkTier === 'Degraded'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            {networkTier === '6G' ? (
                              <Zap size={20} />
                            ) : networkTier === 'Degraded' ? (
                              <AlertTriangle size={20} />
                            ) : (
                              <Wifi size={20} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Current Connection</p>
                            <p className="text-xs text-gray-600">
                              {networkTier === '6G'
                                ? 'Premium 6G Network Slice (Ultra-Low Latency)'
                                : networkTier === 'Degraded'
                                  ? 'Network congestion detected (buffering and low bitrate)'
                                  : 'Standard 5G Network (Best Effort)'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="mb-3 font-bold">Comments</h3>
                        <div className="mb-4 flex items-start space-x-3">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-300"></div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              Gamer123 <span className="text-[10px] font-normal text-gray-500">1 min ago</span>
                            </p>
                            <p className="text-sm text-gray-700">The graphics in this area are unbelievable!</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-300"></div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              TechNerd <span className="text-[10px] font-normal text-gray-500">5 mins ago</span>
                            </p>
                            <p className="text-sm text-gray-700">Hope my network can handle streaming this later...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : isGaming ? (
                  <>
                    <CloudGame networkTier={networkTier} />

                    <div className="p-5">
                      <h2 className="mb-1 text-xl font-bold text-gray-900">Cyber Void: Cloud Edition</h2>
                      <p className="mb-4 flex items-center text-sm text-gray-500">
                        <Crosshair size={14} className="mr-1" /> Cloud Server: US-East
                      </p>

                      <div
                        className={`mb-6 rounded-xl border p-4 transition-colors duration-500 ${
                          networkTier === '6G'
                            ? 'border-purple-200 bg-purple-50'
                            : networkTier === 'Degraded'
                              ? 'border-red-200 bg-red-50'
                              : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`rounded-full p-2 ${
                              networkTier === '6G'
                                ? 'bg-purple-100 text-purple-600'
                                : networkTier === 'Degraded'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            {networkTier === '6G' ? (
                              <Zap size={20} />
                            ) : networkTier === 'Degraded' ? (
                              <AlertTriangle size={20} />
                            ) : (
                              <Wifi size={20} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">QoS Status</p>
                            <p className="text-xs text-gray-600">
                              {networkTier === '6G'
                                ? 'Premium 6G Edge (0ms jitter, 60fps)'
                                : networkTier === 'Degraded'
                                  ? 'Severe packet loss detected (input delayed)'
                                  : 'Standard 5G (Best Effort)'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-3 font-bold">Live Chat</h3>
                        <div className="mb-4 flex items-start space-x-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                            P1
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              ProGamer <span className="text-[10px] font-normal text-gray-500">Live</span>
                            </p>
                            <p className="text-sm text-gray-700">Cloud gaming really needs low latency.</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                            T2
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              TechNerd <span className="text-[10px] font-normal text-gray-500">Live</span>
                            </p>
                            <p className="text-sm text-gray-700">Has anyone tried the new 6G slice API yet?</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-0 flex-col bg-slate-50">
                    <div
                      data-testid="intent-transcript"
                      className="min-h-[180px] flex-1 space-y-3 overflow-y-auto p-4"
                    >
                      {intentMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                              message.role === 'user'
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-200 bg-white text-slate-800'
                            }`}
                          >
                            <div className="mb-2 flex w-full items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 text-xs font-bold uppercase leading-tight tracking-wide">
                                {message.role === 'user' ? 'user intent' : message.title ?? 'core network'}
                              </div>
                              <div
                                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase leading-none tracking-wide ${
                                  message.role === 'user'
                                    ? 'bg-slate-700 text-slate-200'
                                    : message.status === 'processing'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {message.status === 'processing'
                                  ? 'processing'
                                  : message.category
                                    ? message.category
                                    : message.timestamp}
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed">{message.text}</p>
                            <div
                              className={`mt-2 text-[10px] ${
                                message.role === 'user' ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              {message.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex-none border-t border-slate-200 bg-white p-4">
                      <label htmlFor="intent-input" className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Intent Payload
                      </label>
                      <textarea
                        id="intent-input"
                        data-testid="intent-input"
                        value={intentDraft}
                        onChange={(event) => setIntentDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                            event.preventDefault();
                            submitIntent(intentDraft);
                          }
                        }}
                        rows={2}
                        placeholder="Example: fix my buffering and prioritize this video session."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                      />
                      <div className="mt-3 flex flex-col items-stretch gap-2">
                        <p className="text-xs leading-relaxed text-slate-500">Stub only. No real backend request is sent.</p>
                        <button
                          type="button"
                          data-testid="intent-suggest"
                          onClick={() => setIntentDraft(SUGGESTED_INTENT)}
                          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          Suggest
                        </button>
                        <button
                          type="button"
                          data-testid="intent-send"
                          disabled={isIntentSending || !intentDraft.trim()}
                          onClick={() => submitIntent(intentDraft)}
                          className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {isIntentSending ? 'Sending...' : 'Send Intent'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isIntent && showModal && !modalExpanded && (
                <div className="absolute inset-x-4 top-[132px] z-50 animate-[slideDown_0.3s_ease-out] transform transition-all">
                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 bg-white p-3 shadow-xl transition-colors hover:bg-gray-50 ${modalAccent.border}`}
                    onClick={() => setModalExpanded(true)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`animate-pulse rounded-full p-2 ${modalAccent.chip}`}>
                        {isGaming ? <Gamepad2 size={18} /> : <Zap size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {isGaming ? 'Input Latency High' : 'Network Lag Detected'}
                        </p>
                        <p className={`text-xs font-medium ${isGaming ? 'text-cyan-600' : 'text-purple-600'}`}>
                          {isGaming ? 'Tap to activate 6G Edge Boost' : 'Tap to activate 6G Boost'}
                        </p>
                      </div>
                    </div>
                    <div className={`rounded-full px-4 py-2 text-xs font-bold text-white ${modalAccent.button}`}>
                      {isGaming ? 'Fix Lag' : 'Fix'}
                    </div>
                  </div>
                </div>
              )}

              {!isIntent && showModal && modalExpanded && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                  <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => {
                      setShowModal(false);
                      setModalExpanded(false);
                    }}
                  ></div>

                  <div className="relative z-10 w-full animate-[slideUp_0.3s_ease-out] transform rounded-3xl bg-white p-6 shadow-2xl transition-all">
                    {!isUpgrading && !upgradeSuccess ? (
                      <>
                        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${modalAccent.chip}`}>
                          <Cpu size={24} />
                        </div>
                        <h3 className="mb-2 text-center text-xl font-bold">
                          {isGaming ? 'Enhance Gaming Session?' : 'Enhance Your Experience?'}
                        </h3>
                        <p className="mb-6 text-center text-sm text-gray-500">
                          {isGaming ? (
                            <>
                              Our network AI detected input latency. Migrate this session to a <strong>6G Edge Node</strong>{' '}
                              for guaranteed 60 FPS and ultra-low ping?
                            </>
                          ) : (
                            <>
                              Our network AI detected lag. Activate a dedicated <strong>6G Premium Slice</strong> for
                              guaranteed 4K streaming and zero buffering?
                            </>
                          )}
                        </p>

                        <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                          <span className="text-sm font-medium text-gray-700">Cost</span>
                          <span className={`text-sm font-bold ${modalAccent.price}`}>$0.99 / hr</span>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={handleUpgrade}
                            className={`w-full rounded-xl bg-gradient-to-r px-4 py-3.5 font-bold text-white shadow-lg transition-all active:scale-[0.98] ${modalAccent.gradient} ${modalAccent.shadow}`}
                          >
                            {isGaming ? 'Activate 6G Edge Boost' : 'Activate 6G Boost'}
                          </button>
                          <button
                            onClick={() => {
                              setShowModal(false);
                              setModalExpanded(false);
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 font-medium text-gray-500 transition-colors hover:bg-gray-50"
                          >
                            Continue with lag
                          </button>
                        </div>
                      </>
                    ) : upgradeSuccess ? (
                      <div className="py-6 text-center">
                        <CheckCircle2 size={48} className="mx-auto mb-4 animate-[bounce_0.5s_ease-in-out] text-green-500" />
                        <h3 className="mb-2 text-xl font-bold">{isGaming ? '6G Edge Activated!' : '6G Boost Activated!'}</h3>
                        <p className="text-sm text-gray-500">
                          {isGaming
                            ? 'Session migrated. Enjoy zero latency.'
                            : 'Your network slice has been upgraded. Enjoy seamless 4K.'}
                        </p>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Loader2
                          size={40}
                          className={`mx-auto mb-4 animate-spin ${isGaming ? 'text-cyan-600' : 'text-purple-600'}`}
                        />
                        <h3 className="mb-2 text-lg font-bold">
                          {isGaming ? 'Negotiating Intent...' : 'Negotiating Network Intent...'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {isGaming ? 'Contacting 6G Core UPF / Edge Server' : 'Contacting 6G Core AI Agent Gateway'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isNativeShell && (
                <div className="absolute inset-x-0 bottom-2 z-40 flex justify-center">
                  <div className="h-1 w-32 rounded-full bg-black/20"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isNativeShell && (
          <div className="w-full flex-1 rounded-3xl border border-gray-100 bg-white p-8 shadow-xl lg:max-w-md">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
              <Settings className="mr-2 text-blue-500" /> Presenter Controls
            </h2>

            {isIntent && (
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Direct Intent is self-contained in the phone UI. Use the controls below only after switching back to the
                Streaming or Gaming demos.
              </div>
            )}

            <div className="space-y-6">
              <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                <h3 className="mb-2 font-bold text-slate-800">1. Choose Demo Experience</h3>
                <p className="mb-3 text-sm text-slate-600">These presenter-side controls apply to the Streaming and Gaming demos only.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExperienceChange('streaming')}
                    className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                      isStreaming ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Streaming
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExperienceChange('gaming')}
                    className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                      isGaming ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Gaming
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="mb-2 font-bold text-blue-800">2. Initial State</h3>
                <p className="mb-3 text-sm text-blue-600">{initialStateCopy}</p>
                <button
                  onClick={resetNetwork}
                  disabled={networkTier === '5G' || isIntent}
                  className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  Reset to Standard 5G
                </button>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <h3 className="mb-2 font-bold text-red-800">3. Simulate Congestion</h3>
                <p className="mb-3 text-sm text-red-600">{congestionCopy}</p>
                <button
                  onClick={triggerDegradation}
                  disabled={networkTier !== '5G' || isIntent}
                  className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  Trigger Network Degradation
                </button>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  isIntent
                    ? 'border-slate-200 bg-slate-50'
                    : isGaming
                      ? 'border-cyan-100 bg-cyan-50'
                      : 'border-purple-100 bg-purple-50'
                }`}
              >
                <h3 className={`mb-2 font-bold ${isIntent ? 'text-slate-800' : isGaming ? 'text-cyan-800' : 'text-purple-800'}`}>
                  4. Intent Execution
                </h3>
                <p className={`mb-3 text-sm ${isIntent ? 'text-slate-600' : isGaming ? 'text-cyan-700' : 'text-purple-600'}`}>
                  {isIntent
                    ? 'Direct Intent requests stay inside the stub console and do not allocate demo slices or alter network state.'
                    : isGaming
                      ? 'Accept the offer on the device to move the game session onto a premium 6G edge slice.'
                      : 'Accept the offer on the device to allocate a premium 6G streaming slice.'}
                </p>
                <div
                  className={`flex items-center space-x-2 rounded border bg-white p-2 text-sm font-medium ${
                    isIntent
                      ? 'border-slate-200 text-slate-600'
                      : isGaming
                        ? 'border-cyan-200 text-cyan-700'
                        : 'border-purple-200 text-purple-700'
                  }`}
                >
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isIntent ? 'bg-slate-300' : networkTier === '6G' ? 'animate-pulse bg-green-500' : 'bg-gray-300'
                    }`}
                  ></div>
                  <span>
                    {isIntent
                      ? 'Demo slice state unchanged'
                      : `${isGaming ? '6G Edge Status' : '6G Slice Status'}: ${networkTier === '6G' ? 'ACTIVE' : 'INACTIVE'}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6 text-xs text-gray-400">
              <strong>Architecture Note:</strong>{' '}
              {isIntent
                ? 'The direct intent tab is currently a local stub that mimics core-network acknowledgements without any backend integration.'
                : `In production, the app calls the AI Agent Gateway to translate user intent (${
                    isGaming ? '"fix my game lag"' : '"fix my buffering"'
                  }) into 3GPP QoS policies via the NEF/PCF.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
