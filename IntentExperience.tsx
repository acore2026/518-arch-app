import type { RefObject, ReactNode } from 'react';
import { ArrowLeft, Database, Globe2, Loader2, Mic, SendHorizontal } from 'lucide-react';
import type { Experience, IntentMessage, IntentSelectionCategory } from './app-types';
import type { ConversationSnapshot } from './intent-clarification-types';

type IntentExperienceProps = {
  awaitingReply: boolean;
  backendConnectionAccent: { bg: string; text: string };
  backendConnectionLabel: string;
  backendConversation: ConversationSnapshot;
  displayedMessages: IntentMessage[];
  experienceMenu: ReactNode;
  hasSystemAgentEndpoint: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  intentCategory: IntentSelectionCategory | null;
  intentDraft: string;
  isIntentSending: boolean;
  lastShowcaseExperience: Experience;
  resolvedBackendUrl: string;
  showExperienceMenu: boolean;
  onBack(experience: Experience): void;
  onClearHandoffMessages(): void;
  onLaunchMoonlight(messageId: string): void;
  onResetLocalMessages(): void;
  onResetRemoteSession(): void;
  onSetIntentCategory(category: IntentSelectionCategory): void;
  onSetIntentDraft(value: string): void;
  onSetShowExperienceMenu(open: boolean): void;
  onSubmitIntent(input: string): void;
  onSuggestIntent(): void;
};

export function IntentExperience({
  awaitingReply,
  backendConnectionAccent,
  backendConnectionLabel,
  backendConversation,
  displayedMessages,
  experienceMenu,
  hasSystemAgentEndpoint,
  inputRef,
  intentCategory,
  intentDraft,
  isIntentSending,
  lastShowcaseExperience,
  resolvedBackendUrl,
  showExperienceMenu,
  onBack,
  onClearHandoffMessages,
  onLaunchMoonlight,
  onResetLocalMessages,
  onResetRemoteSession,
  onSetIntentCategory,
  onSetIntentDraft,
  onSetShowExperienceMenu,
  onSubmitIntent,
  onSuggestIntent,
}: IntentExperienceProps) {
  const renderMessage = (message: IntentMessage) => {
    const isUser = message.role === 'user';
    const actionState = message.actionCard?.state;
    const isActionDisabled = actionState === 'launching' || actionState === 'launched' || actionState === 'unavailable';

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[84%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
          <div
            className={`rounded-[26px] px-5 py-4 shadow-sm ${
              isUser
                ? 'rounded-br-md bg-[#3568e9] text-white'
                : message.isError
                  ? 'rounded-bl-md border border-red-100 bg-red-50 text-red-900'
                  : 'rounded-bl-md bg-slate-100 text-slate-900'
            }`}
          >
            {!isUser && message.title && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{message.title}</div>}
            <p className="text-[17px] leading-8">{message.text}</p>

            {message.finalData && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-4 text-left text-slate-900">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Final Data</div>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {JSON.stringify(message.finalData, null, 2)}
                </pre>
              </div>
            )}

            {message.actionCard && (
              <div
                data-testid="intent-launch-card"
                className="mt-5 rounded-[24px] border border-blue-100 bg-white p-4 text-left text-slate-900 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Database size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold">{message.actionCard.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{message.actionCard.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="intent-launch-confirm"
                  disabled={isActionDisabled}
                  onClick={() => onLaunchMoonlight(message.id)}
                  className="mt-4 w-full rounded-2xl bg-[#3568e9] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#2d59ca] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionState === 'launching' ? 'Launching...' : message.actionCard.buttonLabel}
                </button>
              </div>
            )}
          </div>
          <div className={`mt-2 px-1 text-xs ${isUser ? 'text-blue-300' : 'text-slate-400'}`}>{message.timestamp}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-[#fbfcff]">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => onBack(lastShowcaseExperience)}
          className="flex items-center gap-1 text-base font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3568e9] text-white shadow-sm">
            <Globe2 size={19} />
          </div>
          <span className="mt-1 text-xs font-semibold tracking-[0.22em] text-slate-400">NETAGENT</span>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <span
              data-testid="intent-backend-status"
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                hasSystemAgentEndpoint ? `${backendConnectionAccent.bg} ${backendConnectionAccent.text}` : 'bg-slate-100 text-slate-500'
              }`}
            >
              {hasSystemAgentEndpoint ? backendConnectionLabel : 'Stub Mode'}
            </span>
            {hasSystemAgentEndpoint && backendConversation.sessionId > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Session {backendConversation.sessionId}
              </span>
            )}
          </div>
        </div>
        {experienceMenu}
      </div>

      <div
        data-testid="intent-transcript"
        className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-white px-4 py-5"
        onClick={() => {
          if (showExperienceMenu) {
            onSetShowExperienceMenu(false);
          }
        }}
      >
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Backend</div>
            <div className="truncate text-sm font-medium text-slate-700">
              {hasSystemAgentEndpoint ? resolvedBackendUrl : 'Local stub flow'}
            </div>
          </div>
          <button
            type="button"
            data-testid="intent-new-session"
            onClick={() => {
              if (hasSystemAgentEndpoint) {
                onResetRemoteSession();
                onClearHandoffMessages();
              } else {
                onResetLocalMessages();
              }
            }}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            New Session
          </button>
        </div>

        {displayedMessages.map(renderMessage)}
      </div>

      <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white px-4 pb-4 pt-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Intent Category</span>
          <div className="flex gap-1.5">
            {(['experience', 'compute'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSetIntentCategory(cat)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  intentCategory === cat
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="intent-suggest"
            aria-label="Insert suggested intent"
            onClick={onSuggestIntent}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold tracking-tight text-slate-500 transition-colors hover:bg-slate-200"
          >
            ...
          </button>
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              id="intent-input"
              data-testid="intent-input"
              type="text"
              value={intentDraft}
              onChange={(event) => onSetIntentDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSubmitIntent(intentDraft);
                }
              }}
              placeholder="Message NetAgent..."
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-3.5 pr-12 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              data-testid="intent-send"
              aria-label="Send intent"
              disabled={!intentDraft.trim() || (!hasSystemAgentEndpoint && (isIntentSending || !intentCategory)) || awaitingReply}
              onClick={() => onSubmitIntent(intentDraft)}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-sky-400 text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {(hasSystemAgentEndpoint ? awaitingReply : isIntentSending) ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <SendHorizontal size={16} />
              )}
            </button>
          </div>
          <button
            type="button"
            aria-label="Voice input unavailable"
            onClick={() => inputRef.current?.focus()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sky-500 transition-colors hover:bg-sky-50"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
