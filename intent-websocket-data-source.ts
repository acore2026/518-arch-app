import type { ClientFrame, ServerFrame } from './intent-clarification-types';

export type SocketLifecycleState = 'disconnected' | 'connecting' | 'connected';

export type WebSocketLike = {
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
};

export type WebSocketFactory = (url: string) => WebSocketLike;

export const HEARTBEAT_INTERVAL_MS = 15000;
export const HEARTBEAT_TIMEOUT_MS = 10000;
export const MAX_RECONNECT_DELAY_MS = 10000;
const SOCKET_CONNECTING = 0;
const SOCKET_OPEN = 1;

export function parseServerFrame(raw: string): ServerFrame {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (parsed.type === 'turn_result') {
    if (typeof parsed.reply !== 'string' || typeof parsed.session_id !== 'number') {
      throw new Error('Malformed turn_result frame');
    }

    return {
      type: 'turn_result',
      session_id: parsed.session_id,
      status: parsed.status === 'DONE' ? 'DONE' : 'CLARIFY',
      reply: parsed.reply,
      context: isRecord(parsed.context) ? parsed.context : undefined,
      final_data: isRecord(parsed.final_data) ? parsed.final_data : parsed.final_data === null ? null : undefined,
      metrics: isRecord(parsed.metrics) ? parsed.metrics : undefined,
      raw_result: isRecord(parsed.raw_result) ? parsed.raw_result : undefined,
    };
  }

  if (parsed.type === 'error') {
    if (typeof parsed.message !== 'string') {
      throw new Error('Malformed error frame');
    }

    return {
      type: 'error',
      code: typeof parsed.code === 'string' ? parsed.code : undefined,
      message: parsed.message,
    };
  }

  if (parsed.type === 'pong') {
    return { type: 'pong' };
  }

  throw new Error('Unsupported server frame');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

type DataSourceListeners = {
  onFrame?: (frame: ServerFrame) => void;
  onStateChange?: (state: SocketLifecycleState) => void;
  onSocketError?: (error: Error) => void;
};

export class IntentWebSocketDataSource {
  private readonly createSocket: WebSocketFactory;
  private readonly listeners: DataSourceListeners;
  private socket: WebSocketLike | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private disposed = false;
  private shouldReconnect = false;
  private currentUrl = '';
  private lifecycleState: SocketLifecycleState = 'disconnected';

  constructor(listeners: DataSourceListeners, createSocket: WebSocketFactory = (url) => new WebSocket(url)) {
    this.listeners = listeners;
    this.createSocket = createSocket;
  }

  getState() {
    return this.lifecycleState;
  }

  connect(url: string) {
    if (!url) {
      this.disconnect();
      return;
    }

    if (this.currentUrl === url && this.socket && (this.socket.readyState === SOCKET_OPEN || this.socket.readyState === SOCKET_CONNECTING)) {
      return;
    }

    this.currentUrl = url;
    this.shouldReconnect = true;
    this.openSocket();
  }

  disconnect() {
    this.shouldReconnect = false;
    this.currentUrl = '';
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.closeSocket();
    this.updateState('disconnected');
  }

  dispose() {
    this.disposed = true;
    this.disconnect();
  }

  send(frame: ClientFrame) {
    if (!this.socket || this.socket.readyState !== SOCKET_OPEN) {
      return false;
    }

    this.socket.send(JSON.stringify(frame));
    if (frame.type !== 'ping') {
      this.clearHeartbeatTimeout();
    }
    return true;
  }

  private openSocket() {
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.closeSocket();
    this.updateState('connecting');

    try {
      const socket = this.createSocket(this.currentUrl);
      this.socket = socket;
      socket.onopen = () => {
        this.reconnectAttempt = 0;
        this.updateState('connected');
        this.startHeartbeat();
      };
      socket.onmessage = (event) => {
        try {
          const frame = parseServerFrame(event.data);
          if (frame.type === 'pong') {
            this.clearHeartbeatTimeout();
          }
          this.listeners.onFrame?.(frame);
        } catch (error) {
          this.listeners.onSocketError?.(error instanceof Error ? error : new Error('Failed to parse server frame'));
        }
      };
      socket.onerror = () => {
        this.listeners.onSocketError?.(new Error('Socket transport error'));
      };
      socket.onclose = () => {
        this.stopHeartbeat();
        this.socket = null;
        if (!this.shouldReconnect || this.disposed || !this.currentUrl) {
          this.updateState('disconnected');
          return;
        }

        this.scheduleReconnect();
      };
    } catch (error) {
      this.listeners.onSocketError?.(error instanceof Error ? error : new Error('Failed to open socket'));
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.clearReconnectTimer();
    this.updateState('connecting');
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect && this.currentUrl && !this.disposed) {
        this.openSocket();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.send({ type: 'ping' })) {
        return;
      }

      this.clearHeartbeatTimeout();
      this.heartbeatTimeout = setTimeout(() => {
        this.heartbeatTimeout = null;
        this.closeSocket();
      }, HEARTBEAT_TIMEOUT_MS);
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }

  private clearHeartbeatTimeout() {
    if (this.heartbeatTimeout !== null) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private closeSocket() {
    if (!this.socket) {
      return;
    }

    const socket = this.socket;
    this.socket = null;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    if (socket.readyState === SOCKET_OPEN || socket.readyState === SOCKET_CONNECTING) {
      socket.close(1000, 'disconnect');
    }
  }

  private updateState(nextState: SocketLifecycleState) {
    if (this.lifecycleState === nextState) {
      return;
    }

    this.lifecycleState = nextState;
    this.listeners.onStateChange?.(nextState);
  }
}
