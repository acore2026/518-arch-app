export type NetworkTier = '5G' | 'Degraded' | '6G';
export type Experience = 'streaming' | 'gaming' | 'intent';
export type IntentSelectionCategory = 'experience' | 'compute';
export type IntentCategory = 'buffering' | 'latency' | 'gaming' | 'slice' | 'unknown';
export type IntentRole = 'user' | 'network';
export type IntentStatus = 'sent' | 'processing' | 'complete';
export type IntentActionState = 'ready' | 'launching' | 'launched' | 'unavailable';

export type IntentActionCard = {
  title: string;
  description: string;
  buttonLabel: string;
  action: 'launch-moonlight';
  state: IntentActionState;
};

export type IntentMessage = {
  id: string;
  role: IntentRole;
  title?: string;
  text: string;
  timestamp: string;
  status: IntentStatus;
  category?: IntentCategory;
  actionCard?: IntentActionCard;
  finalData?: Record<string, unknown> | null;
  isError?: boolean;
};

export type StubIntentResult = {
  category: IntentCategory;
  title: string;
  text: string;
  actionCard?: Omit<IntentActionCard, 'state'>;
};
