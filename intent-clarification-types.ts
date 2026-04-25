export type IntentBackendName = 'glm5';

export type TurnResultStatus = 'CLARIFY' | 'DONE';
export type SocketUiState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'sending'
  | 'clarify'
  | 'done'
  | 'error';

export type ConversationMessageRole = 'user' | 'assistant' | 'system';

export type SendTurnFrame = {
  type: 'send_turn';
  session_id?: number;
  user_input: string;
  backend: IntentBackendName;
};

export type PingFrame = {
  type: 'ping';
};

export type ClientFrame = SendTurnFrame | PingFrame;

export type TurnResultFrame = {
  type: 'turn_result';
  session_id: number;
  status: TurnResultStatus;
  reply: string;
  context?: Record<string, unknown>;
  final_data?: Record<string, unknown> | null;
  metrics?: Record<string, unknown>;
  raw_result?: Record<string, unknown>;
};

export type ErrorFrame = {
  type: 'error';
  code?: string;
  message: string;
};

export type PongFrame = {
  type: 'pong';
};

export type ServerFrame = TurnResultFrame | ErrorFrame | PongFrame;

export type ConversationMessage = {
  id: string;
  role: ConversationMessageRole;
  title?: string;
  text: string;
  timestamp: string;
  finalData?: Record<string, unknown> | null;
  rawResult?: Record<string, unknown>;
  isError?: boolean;
  isStatus?: boolean;
};

export type ConversationSnapshot = {
  uiState: SocketUiState;
  backendHost: string;
  backendUrl: string;
  backendName: IntentBackendName;
  sessionId: number;
  messages: ConversationMessage[];
  lastError?: string;
  lastTurnStatus?: TurnResultStatus;
  awaitingReply: boolean;
  isConfigured: boolean;
};

