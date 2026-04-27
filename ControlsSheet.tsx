import { Settings } from 'lucide-react';
import type { Experience } from './app-types';

type ControlsSheetProps = {
  backendConnectionLabel: string;
  computeNodeDraft: string;
  congestionCopy: string;
  hasComputeNodeEndpoint: boolean;
  hasSystemAgentEndpoint: boolean;
  initialStateCopy: string;
  isGaming: boolean;
  isIntent: boolean;
  isOpen: boolean;
  isStreaming: boolean;
  networkTier: string;
  resolvedBackendUrl: string;
  resolvedComputeNodeBaseUrl: string;
  resolvedComputeNodeOverloadUrl: string;
  systemAgentDraft: string;
  onChangeComputeNodeDraft(value: string): void;
  onChangeExperience(experience: Experience): void;
  onChangeSystemAgentDraft(value: string): void;
  onClearComputeNode(): void;
  onClearSystemAgent(): void;
  onClose(): void;
  onOpen(): void;
  onResetNetwork(): void;
  onSaveComputeNode(): void;
  onSaveSystemAgent(): void;
  onTriggerDegradation(): void;
};

export function ControlsSheet({
  backendConnectionLabel,
  computeNodeDraft,
  congestionCopy,
  hasComputeNodeEndpoint,
  hasSystemAgentEndpoint,
  initialStateCopy,
  isGaming,
  isIntent,
  isOpen,
  isStreaming,
  networkTier,
  resolvedBackendUrl,
  resolvedComputeNodeBaseUrl,
  resolvedComputeNodeOverloadUrl,
  systemAgentDraft,
  onChangeComputeNodeDraft,
  onChangeExperience,
  onChangeSystemAgentDraft,
  onClearComputeNode,
  onClearSystemAgent,
  onClose,
  onOpen,
  onResetNetwork,
  onSaveComputeNode,
  onSaveSystemAgent,
  onTriggerDegradation,
}: ControlsSheetProps) {
  return (
    <>
      <button
        type="button"
        data-testid="controls-trigger"
        aria-label="Open controls"
        onClick={onOpen}
        className={`fixed right-4 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.22)] transition-colors hover:bg-slate-800 ${
          isIntent ? 'bottom-24' : 'bottom-6'
        }`}
      >
        <Settings size={16} />
        <span>Controls</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center sm:p-6">
          <button type="button" aria-label="Close controls" onClick={onClose} className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" />
          <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[32px] bg-white px-5 pb-6 pt-4 shadow-2xl sm:max-w-md sm:rounded-[32px]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200"></div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Live Controls</div>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Control Panel</h2>
                <p className="mt-1 text-sm text-slate-500">Use these controls directly in the app without a separate control page.</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600">
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Experience</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    data-testid="controls-streaming"
                    onClick={() => onChangeExperience('streaming')}
                    className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      isStreaming ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Stream
                  </button>
                  <button
                    type="button"
                    data-testid="controls-gaming"
                    onClick={() => onChangeExperience('gaming')}
                    className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      isGaming ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Game
                  </button>
                  <button
                    type="button"
                    data-testid="controls-intent"
                    onClick={() => onChangeExperience('intent')}
                    className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      isIntent ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Intent
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">System Agent Backend</div>
                <p className="mt-2 text-sm text-emerald-800">
                  Configure the backend host. Direct Intent keeps one WebSocket connection open to <code>/api/ws</code> on port <code>7201</code>.
                </p>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Backend Host</label>
                <input
                  data-testid="system-agent-endpoint-input"
                  type="text"
                  value={systemAgentDraft}
                  onChange={(event) => onChangeSystemAgentDraft(event.target.value)}
                  placeholder="192.168.1.20"
                  className="mt-3 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="system-agent-save"
                    onClick={onSaveSystemAgent}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    data-testid="system-agent-clear"
                    onClick={onClearSystemAgent}
                    className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900">
                  <span className="font-semibold">Status:</span>{' '}
                  <span data-testid="system-agent-status">{hasSystemAgentEndpoint ? backendConnectionLabel : 'Stub mode'}</span>
                </div>
                {hasSystemAgentEndpoint && <p className="mt-2 break-all text-xs text-emerald-700">{resolvedBackendUrl}</p>}
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Compute Node</div>
                <p className="mt-2 text-sm text-amber-800">
                  Configure the node that controls Moonlight stream scenarios on port <code>7878</code>.
                </p>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Compute Node Host</label>
                <input
                  data-testid="compute-node-host-input"
                  type="text"
                  value={computeNodeDraft}
                  onChange={(event) => onChangeComputeNodeDraft(event.target.value)}
                  placeholder="192.168.1.20"
                  className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="compute-node-save"
                    onClick={onSaveComputeNode}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    data-testid="compute-node-clear"
                    onClick={onClearComputeNode}
                    className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900">
                  <span className="font-semibold">Status:</span>{' '}
                  <span data-testid="compute-node-status">{hasComputeNodeEndpoint ? 'Configured' : 'Not configured'}</span>
                </div>
                {hasComputeNodeEndpoint && (
                  <div className="mt-2 space-y-1 break-all text-xs text-amber-700">
                    <p>Base: {resolvedComputeNodeBaseUrl}</p>
                    <p>Overload: {resolvedComputeNodeOverloadUrl}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Reset</div>
                <p className="mt-2 text-sm text-blue-700">{initialStateCopy}</p>
                <button
                  type="button"
                  data-testid="controls-reset"
                  onClick={onResetNetwork}
                  disabled={networkTier === '5G' || isIntent}
                  className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-200"
                >
                  Reset to Standard 5G
                </button>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Congestion</div>
                <p className="mt-2 text-sm text-red-700">{congestionCopy}</p>
                <button
                  type="button"
                  data-testid="controls-degrade"
                  onClick={onTriggerDegradation}
                  disabled={networkTier !== '5G' || isIntent}
                  className="mt-3 w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-red-200"
                >
                  Trigger Network Degradation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
