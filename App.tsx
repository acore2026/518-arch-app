import React, { useState, useEffect, useRef } from 'react';
import { 
  Signal, 
  Wifi, 
  Battery, 
  Play, 
  Pause, 
  Settings, 
  Zap, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2,
  Cpu
} from 'lucide-react';

export default function App() {
  // Application States
  const [networkTier, setNetworkTier] = useState<'5G' | 'Degraded' | '6G'>('5G');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalExpanded, setModalExpanded] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  
  // Timer for automatic pop-up
  const degradationTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handle play/pause sync with real video
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (networkTier === 'Degraded' || !isPlaying) {
      videoRef.current.pause();
    } else {
      // Play the video and catch any browser auto-play restrictions
      videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
    }
  }, [networkTier, isPlaying]);

  // Handle network degradation
  const triggerDegradation = () => {
    setNetworkTier('Degraded');
    setShowModal(false);
    setModalExpanded(false);
    
    // Automatically show the AI upgrade offer after 3 seconds of buffering
    degradationTimer.current = setTimeout(() => {
      setShowModal(true);
      setModalExpanded(false);
    }, 3000);
  };

  // Handle network recovery (reset)
  const resetNetwork = () => {
    if (degradationTimer.current) {
      clearTimeout(degradationTimer.current);
    }
    setNetworkTier('5G');
    setShowModal(false);
    setModalExpanded(false);
    setIsUpgrading(false);
    setUpgradeSuccess(false);
  };

  // Handle the user accepting the upgrade
  const handleUpgrade = () => {
    setIsUpgrading(true);
    
    // Simulate API call to 6G AI Core/NEF
    setTimeout(() => {
      setIsUpgrading(false);
      setUpgradeSuccess(true);
      
      // Briefly show success, then transition to 6G
      setTimeout(() => {
        setNetworkTier('6G');
        setShowModal(false);
        setModalExpanded(false);
        setUpgradeSuccess(false);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
      
      <div className="flex flex-col lg:flex-row items-start gap-12 max-w-6xl w-full">
        
        {/* ========================================= */}
        {/* MOBILE DEVICE SIMULATOR                   */}
        {/* ========================================= */}
        <div className="relative mx-auto lg:mx-0">
          {/* Phone Frame */}
          <div className="w-[350px] h-[750px] bg-black rounded-[3rem] p-3 shadow-2xl relative border-4 border-gray-800">
            
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50">
              <div className="w-32 h-6 bg-black rounded-b-2xl"></div>
            </div>

            {/* Screen Content */}
            <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative flex flex-col">
              
              {/* iOS Status Bar */}
              <div className="h-12 w-full flex justify-between items-end px-6 pb-2 text-xs font-medium z-40 bg-white">
                <span>9:41</span>
                <div className="flex items-center space-x-1.5">
                  <Signal size={14} className={networkTier === 'Degraded' ? 'text-red-500' : 'text-black'} />
                  {networkTier === '6G' ? (
                    <span className="font-bold text-purple-600 text-[10px]">6G</span>
                  ) : (
                    <span className="font-bold text-[10px]">5G</span>
                  )}
                  <Battery size={16} />
                </div>
              </div>

              {/* App Header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    V
                  </div>
                  <h1 className="font-bold text-lg">StreamFlex</h1>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto pb-8">
                {/* Real Video Player */}
                <div className="relative w-full aspect-video bg-black overflow-hidden group">
                  <video 
                    ref={videoRef}
                    src="https://vjs.zencdn.net/v/oceans.mp4"
                    poster="https://vjs.zencdn.net/v/oceans.png"
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
                    style={{ 
                      filter: networkTier === 'Degraded' ? 'blur(6px) brightness(0.6)' : 'blur(0px) brightness(1)'
                    }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    crossOrigin="anonymous"
                  />
                  
                  {/* 4K/6G Watermark */}
                  <div className="absolute top-2 right-2 flex space-x-1 z-20">
                    <span className="bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                      4K HDR
                    </span>
                    {networkTier === '6G' && (
                      <span className="bg-purple-600/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center shadow-[0_0_10px_rgba(147,51,234,0.8)]">
                        <Zap size={10} className="mr-0.5" /> 6G BOOST
                      </span>
                    )}
                  </div>

                  {/* Buffering Overlay */}
                  {networkTier === 'Degraded' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                      <Loader2 className="text-white animate-spin mb-2" size={32} />
                      <p className="text-white text-xs font-medium">Buffering...</p>
                    </div>
                  )}

                  {/* Video Controls */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-blue-400 transition-colors z-30">
                      {isPlaying && networkTier !== 'Degraded' ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <div className="flex-1 mx-3 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-1/3"></div>
                    </div>
                    <Settings size={18} className="text-white" />
                  </div>
                </div>
                
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-1">Elden Ring: Shadow of the Erdtree - 4K Gameplay</h2>
                  <p className="text-sm text-gray-500 mb-4">1.2M views • 2 hours ago</p>
                  
                  <div className="flex space-x-3 mb-6">
                    <button className="flex-1 bg-gray-100 py-2 rounded-full text-sm font-medium flex justify-center items-center">
                       👍 145K
                    </button>
                    <button className="flex-1 bg-gray-100 py-2 rounded-full text-sm font-medium">
                      Share
                    </button>
                  </div>

                  {/* Network Status Indicator */}
                  <div className={`p-4 rounded-xl border ${networkTier === '6G' ? 'bg-purple-50 border-purple-200' : networkTier === 'Degraded' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} transition-colors duration-500`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${networkTier === '6G' ? 'bg-purple-100 text-purple-600' : networkTier === 'Degraded' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {networkTier === '6G' ? <Zap size={20} /> : networkTier === 'Degraded' ? <AlertTriangle size={20} /> : <Wifi size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Current Connection</p>
                        <p className="text-xs text-gray-600">
                          {networkTier === '6G' ? 'Premium 6G Network Slice (Ultra-Low Latency)' : 
                           networkTier === 'Degraded' ? 'Network Congestion Detected (High Ping)' : 
                           'Standard 5G Network (Best Effort)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comments placeholder */}
                  <div className="mt-6">
                    <h3 className="font-bold mb-3">Comments</h3>
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Gamer123 <span className="font-normal text-gray-500 text-[10px]">1 min ago</span></p>
                        <p className="text-sm text-gray-700">The graphics in this area are unbelievable!</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">TechNerd <span className="font-normal text-gray-500 text-[10px]">5 mins ago</span></p>
                        <p className="text-sm text-gray-700">Hope my network can handle streaming this later...</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ========================================= */}
              {/* INTENT POP-UP MODAL (The 6G Feature)      */}
              {/* ========================================= */}
              {showModal && !modalExpanded && (
                <div className="absolute top-[80px] inset-x-4 z-50 transform transition-all animate-[slideDown_0.3s_ease-out]">
                  <div 
                    className="bg-white rounded-2xl p-3 shadow-xl border-2 border-purple-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setModalExpanded(true)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full text-purple-600 animate-pulse">
                        <Zap size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Network Lag Detected</p>
                        <p className="text-xs text-purple-600 font-medium">Tap to activate 6G Boost</p>
                      </div>
                    </div>
                    <div className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full">
                      Fix
                    </div>
                  </div>
                </div>
              )}

              {showModal && modalExpanded && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                  
                  {/* Modal Content */}
                  <div className="bg-white rounded-3xl w-full p-6 shadow-2xl relative z-10 transform transition-all animate-[slideUp_0.3s_ease-out]">
                    
                    {!isUpgrading && !upgradeSuccess ? (
                      <>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600 mx-auto">
                          <Cpu size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">Enhance Your Experience?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                          Our network AI detected lag. Would you like to activate a dedicated <strong>6G Premium Slice</strong> for guaranteed 4K streaming and zero buffering?
                        </p>
                        
                        <div className="bg-gray-50 rounded-xl p-3 mb-6 flex justify-between items-center border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Cost</span>
                          <span className="text-sm font-bold text-purple-600">$0.99 / hr</span>
                        </div>

                        <div className="space-y-3">
                          <button 
                            onClick={handleUpgrade}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all active:scale-[0.98]"
                          >
                            Activate 6G Boost
                          </button>
                          <button 
                            onClick={() => { setShowModal(false); setModalExpanded(false); }}
                            className="w-full bg-white text-gray-500 font-medium py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Continue with lag
                          </button>
                        </div>
                      </>
                    ) : upgradeSuccess ? (
                      <div className="text-center py-6">
                        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4 animate-[bounce_0.5s_ease-in-out]" />
                        <h3 className="text-xl font-bold mb-2">6G Boost Activated!</h3>
                        <p className="text-sm text-gray-500">Your network slice has been upgraded. Enjoy seamless 4K.</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Loader2 size={40} className="text-purple-600 mx-auto mb-4 animate-spin" />
                        <h3 className="text-lg font-bold mb-2">Negotiating Network Intent...</h3>
                        <p className="text-xs text-gray-500">Contacting 6G Core AI Agent Gateway</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Home Indicator */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center z-40">
                <div className="w-32 h-1 bg-black/20 rounded-full"></div>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* PRESENTER CONTROL PANEL                   */}
        {/* ========================================= */}
        <div className="flex-1 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 w-full lg:max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Settings className="mr-2 text-blue-500" /> Presenter Controls
          </h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <h3 className="font-bold text-blue-800 mb-2">1. Initial State</h3>
              <p className="text-sm text-blue-600 mb-3">App starts on standard 5G best-effort delivery. Video plays smoothly at first.</p>
              <button 
                onClick={resetNetwork}
                disabled={networkTier === '5G'}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                Reset to Standard 5G
              </button>
            </div>

            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
              <h3 className="font-bold text-red-800 mb-2">2. Simulate Congestion</h3>
              <p className="text-sm text-red-600 mb-3">Cell tower becomes crowded. Packet loss increases. App will start buffering, then pop-up appears after 3 seconds.</p>
              <button 
                onClick={triggerDegradation}
                disabled={networkTier !== '5G'}
                className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
              >
                Trigger Network Degradation
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
              <h3 className="font-bold text-purple-800 mb-2">3. Intent Execution</h3>
              <p className="text-sm text-purple-600 mb-3">Accept the offer on the phone to watch the API simulation allocate a new 6G SLA slice.</p>
              <div className="flex items-center space-x-2 text-sm text-purple-700 font-medium bg-white p-2 rounded border border-purple-200">
                <div className={`w-3 h-3 rounded-full ${networkTier === '6G' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span>6G Slice Status: {networkTier === '6G' ? 'ACTIVE' : 'INACTIVE'}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
            <strong>Architecture Note:</strong> In production, the app calls the AI Agent Gateway. The gateway translates the user intent ("fix my lag") into 3GPP specific QoS flows via the NEF/PCF.
          </div>
        </div>

      </div>

    </div>
  );
}
