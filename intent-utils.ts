import type { IntentCategory, StubIntentResult } from './app-types';
import type { SocketUiState } from './intent-clarification-types';

export const SUGGESTED_INTENT = 'I want to play Nitro Racer with smooth 4K gameplay.';

export function formatTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function normalizeIntentCategory(category?: string): IntentCategory {
  return category === 'buffering' ||
    category === 'latency' ||
    category === 'gaming' ||
    category === 'slice' ||
    category === 'unknown'
    ? category
    : 'unknown';
}

export function getIntentSocketStateLabel(state: SocketUiState) {
  if (state === 'connecting') {
    return 'Connecting';
  }

  if (state === 'connected') {
    return 'Connected';
  }

  if (state === 'sending') {
    return 'Sending';
  }

  if (state === 'clarify') {
    return 'Clarify';
  }

  if (state === 'done') {
    return 'Done';
  }

  if (state === 'error') {
    return 'Error';
  }

  return 'Disconnected';
}

export function getIntentSocketStateAccent(state: SocketUiState) {
  if (state === 'connected' || state === 'done') {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    };
  }

  if (state === 'sending' || state === 'clarify' || state === 'connecting') {
    return {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
    };
  }

  if (state === 'error') {
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
    };
  }

  return {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
  };
}

export function isGameLaunchIntent(normalized: string) {
  return (
    normalized.includes('game') ||
    normalized.includes('gaming') ||
    normalized.includes('nitro racer') ||
    normalized.includes('王者') ||
    normalized.includes('打王者') ||
    normalized.includes('moonlight') ||
    (normalized.includes('play') &&
      (normalized.includes('smooth') ||
        normalized.includes('4k') ||
        normalized.includes('fps') ||
        normalized.includes('launch') ||
        normalized.includes('cloud')))
  );
}

export function getStubIntentResult(intentText: string): StubIntentResult {
  const normalized = intentText.toLowerCase();

  if (isGameLaunchIntent(normalized)) {
    return {
      category: 'gaming',
      title: 'Compute Nearby',
      text: "I've detected available 'Network Computing' capabilities nearby. Would you like me to hand this task over to the Cloud Orchestrator for a high-performance experience?",
      actionCard: {
        title: 'Compute Available',
        description: 'Agent can deduct required compute resources from local Edge node for smooth 4K gameplay.',
        buttonLabel: 'Deduct & Launch',
        action: 'launch-moonlight',
      },
    };
  }

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
