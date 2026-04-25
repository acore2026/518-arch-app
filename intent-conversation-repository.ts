import { buildIntentBackendUrl, normalizeIntentBackendHost } from './intent-clarification-config';
import type {
  ClientFrame,
  ConversationMessage,
  ConversationSnapshot,
  ErrorFrame,
  IntentBackendName,
  ServerFrame,
  SocketUiState,
  TurnResultFrame,
} from './intent-clarification-types';
import { IntentWebSocketDataSource, type SocketLifecycleState, type WebSocketFactory } from './intent-websocket-data-source';

type RepositoryOptions = {
  backendName?: IntentBackendName;
  createSocket?: WebSocketFactory;
  formatTimestamp?: () => string;
  createId?: () => string;
};

const INITIAL_ASSISTANT_MESSAGE: ConversationMessage = {
  id: 'assistant-hello',
  role: 'assistant',
  title: 'NETAGENT',
  text: "Hello! I'm your Network-Aware Agent. How can I help you today?",
  timestamp: '',
};

export class IntentConversationRepository {
  private readonly subscribers = new Set<(snapshot: ConversationSnapshot) => void>();
  private readonly dataSource: IntentWebSocketDataSource;
  private readonly backendName: IntentBackendName;
  private readonly formatTimestamp: () => string;
  private readonly createId: () => string;
  private active = false;
  private queuedFrame: ClientFrame | null = null;
  private snapshot: ConversationSnapshot;
  private socketState: SocketLifecycleState = 'disconnected';

  constructor(options: RepositoryOptions = {}) {
    this.backendName = options.backendName ?? 'glm5';
    this.formatTimestamp = options.formatTimestamp ?? defaultTimestamp;
    this.createId = options.createId ?? defaultId;
    this.snapshot = this.createInitialSnapshot('');
    this.snapshot.messages = [this.withCurrentTimestamp(INITIAL_ASSISTANT_MESSAGE)];

    this.dataSource = new IntentWebSocketDataSource(
      {
        onFrame: (frame) => this.handleFrame(frame),
        onStateChange: (state) => this.handleSocketStateChange(state),
        onSocketError: (error) => this.handleSocketError(error),
      },
      options.createSocket
    );
  }

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: ConversationSnapshot) => void) {
    this.subscribers.add(listener);
    listener(this.snapshot);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  setBackendHost(host: string) {
    const normalizedHost = normalizeIntentBackendHost(host);
    const backendUrl = buildIntentBackendUrl(normalizedHost);
    this.patchSnapshot({
      backendHost: normalizedHost,
      backendUrl,
      isConfigured: Boolean(normalizedHost),
      lastError: normalizedHost ? undefined : this.snapshot.lastError,
    });

    if (!this.active) {
      return;
    }

    if (backendUrl) {
      this.dataSource.connect(backendUrl);
      return;
    }

    this.dataSource.disconnect();
    if (!this.snapshot.awaitingReply) {
      this.patchSnapshot({ uiState: 'disconnected' });
    }
  }

  activate() {
    this.active = true;
    if (this.snapshot.backendUrl) {
      this.dataSource.connect(this.snapshot.backendUrl);
    }
  }

  deactivate() {
    this.active = false;
    this.dataSource.disconnect();
  }

  dispose() {
    this.active = false;
    this.dataSource.dispose();
    this.subscribers.clear();
  }

  resetSession() {
    this.queuedFrame = null;
    this.patchSnapshot({
      sessionId: 0,
      uiState: this.snapshot.isConfigured ? normalizeSocketUiState(this.socketState) : 'disconnected',
      lastError: undefined,
      lastTurnStatus: undefined,
      awaitingReply: false,
      messages: [this.withCurrentTimestamp(INITIAL_ASSISTANT_MESSAGE)],
    });
  }

  submitTurn(input: string) {
    const trimmedInput = input.trim();
    if (!trimmedInput || this.snapshot.awaitingReply || !this.snapshot.isConfigured) {
      return false;
    }

    const frame: ClientFrame = {
      type: 'send_turn',
      session_id: this.snapshot.sessionId > 0 ? this.snapshot.sessionId : 0,
      user_input: trimmedInput,
      backend: this.backendName,
    };

    this.patchSnapshot({
      awaitingReply: true,
      uiState: 'sending',
      lastError: undefined,
      messages: [
        ...this.snapshot.messages,
        this.createConversationMessage('user', trimmedInput, {
          title: 'YOU',
        }),
      ],
    });

    const sent = this.dataSource.send(frame);
    if (!sent) {
      this.queuedFrame = frame;
      if (this.active && this.snapshot.backendUrl) {
        this.dataSource.connect(this.snapshot.backendUrl);
      }
    }

    return true;
  }

  private handleSocketStateChange(state: SocketLifecycleState) {
    this.socketState = state;

    if (state === 'connected' && this.queuedFrame) {
      const queued = this.queuedFrame;
      this.queuedFrame = null;
      this.dataSource.send(queued);
    }

    if (this.snapshot.awaitingReply) {
      if (state === 'disconnected') {
        this.patchSnapshot({ uiState: this.snapshot.isConfigured ? 'connecting' : 'disconnected' });
      } else if (state === 'connected') {
        this.patchSnapshot({ uiState: 'sending' });
      } else {
        this.patchSnapshot({ uiState: 'connecting' });
      }
      return;
    }

    this.patchSnapshot({ uiState: this.snapshot.isConfigured ? normalizeSocketUiState(state) : 'disconnected' });
  }

  private handleSocketError(error: Error) {
    this.patchSnapshot({
      lastError: friendlyErrorMessage(error.message),
      uiState: 'error',
    });
  }

  private handleFrame(frame: ServerFrame) {
    if (frame.type === 'pong') {
      return;
    }

    if (frame.type === 'error') {
      this.handleErrorFrame(frame);
      return;
    }

    this.handleTurnResult(frame);
  }

  private handleErrorFrame(frame: ErrorFrame) {
    const friendlyMessage = friendlyErrorMessage(frame.message);
    this.patchSnapshot({
      awaitingReply: false,
      uiState: 'error',
      lastError: friendlyMessage,
      messages: [
        ...this.snapshot.messages,
        this.createConversationMessage('system', friendlyMessage, {
          title: 'System Agent Error',
          isError: true,
        }),
      ],
    });
  }

  private handleTurnResult(frame: TurnResultFrame) {
    const uiState: SocketUiState = frame.status === 'DONE' ? 'done' : 'clarify';

    this.patchSnapshot({
      sessionId: frame.session_id > 0 ? frame.session_id : this.snapshot.sessionId,
      awaitingReply: false,
      uiState,
      lastError: undefined,
      lastTurnStatus: frame.status,
      messages: [
        ...this.snapshot.messages,
        this.createConversationMessage('assistant', frame.reply, {
          title: frame.status === 'DONE' ? 'Intent Confirmed' : 'Clarification Needed',
          finalData: frame.status === 'DONE' ? frame.final_data ?? null : undefined,
          rawResult: frame.raw_result,
        }),
      ],
    });
  }

  private createInitialSnapshot(backendHost: string): ConversationSnapshot {
    const backendUrl = buildIntentBackendUrl(backendHost);
    return {
      uiState: backendUrl ? 'connecting' : 'disconnected',
      backendHost,
      backendUrl,
      backendName: this.backendName,
      sessionId: 0,
      messages: [],
      awaitingReply: false,
      isConfigured: Boolean(backendUrl),
    };
  }

  private createConversationMessage(
    role: ConversationMessage['role'],
    text: string,
    options: Partial<Omit<ConversationMessage, 'id' | 'role' | 'text' | 'timestamp'>> = {}
  ): ConversationMessage {
    return {
      id: this.createId(),
      role,
      text,
      timestamp: this.formatTimestamp(),
      ...options,
    };
  }

  private withCurrentTimestamp(message: ConversationMessage): ConversationMessage {
    return {
      ...message,
      timestamp: this.formatTimestamp(),
    };
  }

  private patchSnapshot(partial: Partial<ConversationSnapshot>) {
    this.snapshot = {
      ...this.snapshot,
      ...partial,
    };
    for (const subscriber of this.subscribers) {
      subscriber(this.snapshot);
    }
  }
}

function defaultTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function defaultId() {
  return `conversation-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeSocketUiState(state: SocketLifecycleState): SocketUiState {
  if (state === 'connected') {
    return 'connected';
  }

  if (state === 'connecting') {
    return 'connecting';
  }

  return 'disconnected';
}

function friendlyErrorMessage(message: string) {
  if (!message.trim()) {
    return 'The System Agent could not process this request. Please try again.';
  }

  return `${message.trim()}. Please try again.`;
}

