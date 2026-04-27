import type { RefObject } from 'react';
import { AlertTriangle, Crosshair, Loader2, Pause, Play, Settings, Wifi, Zap } from 'lucide-react';
import type { NetworkTier } from './app-types';
import { CloudGame } from './CloudGame';

type StreamingExperienceProps = {
  isPlaying: boolean;
  networkTier: NetworkTier;
  videoRef: RefObject<HTMLVideoElement | null>;
  onTogglePlayback(): void;
};

export function StreamingExperience({ isPlaying, networkTier, videoRef, onTogglePlayback }: StreamingExperienceProps) {
  return (
    <>
      <div className="group relative aspect-video w-full overflow-hidden bg-black">
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

        <div className="absolute right-2 top-2 z-20 flex space-x-1">
          <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">4K HDR</span>
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
            onClick={onTogglePlayback}
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
          <button className="flex flex-1 items-center justify-center rounded-full bg-gray-100 py-2 text-sm font-medium">👍 145K</button>
          <button className="flex-1 rounded-full bg-gray-100 py-2 text-sm font-medium">Share</button>
        </div>

        <NetworkStatusCard networkTier={networkTier} title="Current Connection" />

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
  );
}

export function GamingExperience({ networkTier }: { networkTier: NetworkTier }) {
  return (
    <>
      <CloudGame networkTier={networkTier} />

      <div className="p-5">
        <h2 className="mb-1 text-xl font-bold text-gray-900">Cyber Void: Cloud Edition</h2>
        <p className="mb-4 flex items-center text-sm text-gray-500">
          <Crosshair size={14} className="mr-1" /> Cloud Server: US-East
        </p>

        <NetworkStatusCard networkTier={networkTier} title="QoS Status" gaming />

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
  );
}

function NetworkStatusCard({ networkTier, title, gaming = false }: { networkTier: NetworkTier; title: string; gaming?: boolean }) {
  return (
    <div
      className={`mb-6 rounded-xl border p-4 transition-colors duration-500 ${
        networkTier === '6G'
          ? 'border-purple-200 bg-purple-50'
          : networkTier === 'Degraded'
            ? 'border-red-200 bg-red-50'
            : gaming
              ? 'border-blue-200 bg-blue-50'
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
          {networkTier === '6G' ? <Zap size={20} /> : networkTier === 'Degraded' ? <AlertTriangle size={20} /> : <Wifi size={20} />}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-600">
            {gaming
              ? networkTier === '6G'
                ? 'Premium 6G Edge (0ms jitter, 60fps)'
                : networkTier === 'Degraded'
                  ? 'Severe packet loss detected (input delayed)'
                  : 'Standard 5G (Best Effort)'
              : networkTier === '6G'
                ? 'Premium 6G Network Slice (Ultra-Low Latency)'
                : networkTier === 'Degraded'
                  ? 'Network congestion detected (buffering and low bitrate)'
                  : 'Standard 5G Network (Best Effort)'}
          </p>
        </div>
      </div>
    </div>
  );
}
