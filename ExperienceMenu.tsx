import { Settings } from 'lucide-react';
import type { Experience } from './app-types';

type ExperienceMenuProps = {
  experience: Experience;
  isOpen: boolean;
  onToggle(): void;
  onSelect(experience: Experience): void;
};

export function ExperienceMenu({ experience, isOpen, onToggle, onSelect }: ExperienceMenuProps) {
  const isStreaming = experience === 'streaming';
  const isGaming = experience === 'gaming';
  const isIntent = experience === 'intent';

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="experience-menu-button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <Settings size={14} className="text-slate-500" />
        <span>{isStreaming ? 'Streaming' : isGaming ? 'Gaming' : 'Direct Intent'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-40 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <button
            type="button"
            data-testid="experience-option-streaming"
            onClick={() => onSelect('streaming')}
            className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
              isStreaming ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Streaming
          </button>
          <button
            type="button"
            data-testid="experience-option-gaming"
            onClick={() => onSelect('gaming')}
            className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
              isGaming ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Gaming
          </button>
          <button
            type="button"
            data-testid="experience-option-intent"
            onClick={() => onSelect('intent')}
            className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
              isIntent ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Direct Intent
          </button>
        </div>
      )}
    </div>
  );
}
