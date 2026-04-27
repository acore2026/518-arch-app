import { CheckCircle2, Cpu, Gamepad2, Loader2, Zap } from 'lucide-react';

type UpgradeModalAccent = {
  border: string;
  chip: string;
  button: string;
  gradient: string;
  shadow: string;
  price: string;
};

type UpgradeModalProps = {
  isGaming: boolean;
  isExpanded: boolean;
  isUpgrading: boolean;
  show: boolean;
  success: boolean;
  accent: UpgradeModalAccent;
  onActivate(): void;
  onCollapse(): void;
  onExpand(): void;
};

export function UpgradeModal({
  isGaming,
  isExpanded,
  isUpgrading,
  show,
  success,
  accent,
  onActivate,
  onCollapse,
  onExpand,
}: UpgradeModalProps) {
  if (!show) {
    return null;
  }

  if (!isExpanded) {
    return (
      <div className="absolute inset-x-4 top-[132px] z-50 animate-[slideDown_0.3s_ease-out] transform transition-all">
        <div
          className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 bg-white p-3 shadow-xl transition-colors hover:bg-gray-50 ${accent.border}`}
          onClick={onExpand}
        >
          <div className="flex items-center space-x-3">
            <div className={`animate-pulse rounded-full p-2 ${accent.chip}`}>
              {isGaming ? <Gamepad2 size={18} /> : <Zap size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{isGaming ? 'Input Latency High' : 'Network Lag Detected'}</p>
              <p className={`text-xs font-medium ${isGaming ? 'text-cyan-600' : 'text-purple-600'}`}>
                {isGaming ? 'Tap to activate 6G Edge Boost' : 'Tap to activate 6G Boost'}
              </p>
            </div>
          </div>
          <div className={`rounded-full px-4 py-2 text-xs font-bold text-white ${accent.button}`}>
            {isGaming ? 'Fix Lag' : 'Fix'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCollapse}></div>

      <div className="relative z-10 w-full animate-[slideUp_0.3s_ease-out] transform rounded-3xl bg-white p-6 shadow-2xl transition-all">
        {!isUpgrading && !success ? (
          <>
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${accent.chip}`}>
              <Cpu size={24} />
            </div>
            <h3 className="mb-2 text-center text-xl font-bold">
              {isGaming ? 'Enhance Gaming Session?' : 'Enhance Your Experience?'}
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500">
              {isGaming ? (
                <>
                  Our network AI detected input latency. Migrate this session to a <strong>6G Edge Node</strong> for guaranteed
                  60 FPS and ultra-low ping?
                </>
              ) : (
                <>
                  Our network AI detected lag. Activate a dedicated <strong>6G Premium Slice</strong> for guaranteed 4K streaming
                  and zero buffering?
                </>
              )}
            </p>

            <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
              <span className="text-sm font-medium text-gray-700">Cost</span>
              <span className={`text-sm font-bold ${accent.price}`}>$0.99 / hr</span>
            </div>

            <div className="space-y-3">
              <button
                onClick={onActivate}
                className={`w-full rounded-xl bg-gradient-to-r px-4 py-3.5 font-bold text-white shadow-lg transition-all active:scale-[0.98] ${accent.gradient} ${accent.shadow}`}
              >
                {isGaming ? 'Activate 6G Edge Boost' : 'Activate 6G Boost'}
              </button>
              <button
                onClick={onCollapse}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 font-medium text-gray-500 transition-colors hover:bg-gray-50"
              >
                Continue with lag
              </button>
            </div>
          </>
        ) : success ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={48} className="mx-auto mb-4 animate-[bounce_0.5s_ease-in-out] text-green-500" />
            <h3 className="mb-2 text-xl font-bold">{isGaming ? '6G Edge Activated!' : '6G Boost Activated!'}</h3>
            <p className="text-sm text-gray-500">
              {isGaming ? 'Session migrated. Enjoy zero latency.' : 'Your network slice has been upgraded. Enjoy seamless 4K.'}
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Loader2 size={40} className={`mx-auto mb-4 animate-spin ${isGaming ? 'text-cyan-600' : 'text-purple-600'}`} />
            <h3 className="mb-2 text-lg font-bold">{isGaming ? 'Negotiating Intent...' : 'Negotiating Network Intent...'}</h3>
            <p className="text-xs text-gray-500">
              {isGaming ? 'Contacting 6G Core UPF / Edge Server' : 'Contacting 6G Core AI Agent Gateway'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
