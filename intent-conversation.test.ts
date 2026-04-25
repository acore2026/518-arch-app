import { describe, expect, it, vi } from 'vitest';
import { buildIntentBackendUrl } from './intent-clarification-config';
import { IntentConversationRepository } from './intent-conversation-repository';
import { HEARTBEAT_INTERVAL_MS, MAX_RECONNECT_DELAY_MS, parseServerFrame } from './intent-websocket-data-source';

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = FakeWebSocket.CONNECTING;
  sent: string[] = [];
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(readonly url: string) {}

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  receive(payload: unknown) {
    this.onmessage?.({
      data: JSON.stringify(payload),
    } as MessageEvent<string>);
  }

  fail() {
    this.onerror?.(new Event('error'));
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code: 1006 } as CloseEvent);
  }

  send(data: string) {
    this.sent.push(data);
  }
}

describe('intent clarification transport', () => {
  it('parses supported server frames', () => {
    expect(
      parseServerFrame(
        JSON.stringify({
          type: 'turn_result',
          session_id: 123,
          status: 'DONE',
          reply: 'all set',
          final_data: { profile: 'normal' },
        })
      )
    ).toMatchObject({
      type: 'turn_result',
      session_id: 123,
      status: 'DONE',
      final_data: { profile: 'normal' },
    });

    expect(
      parseServerFrame(
        JSON.stringify({
          type: 'error',
          code: 'bad_request',
          message: 'bad input',
        })
      )
    ).toMatchObject({
      type: 'error',
      code: 'bad_request',
      message: 'bad input',
    });
  });

  it('persists session_id across turns', () => {
    const sockets: FakeWebSocket[] = [];
    const repository = new IntentConversationRepository({
      createSocket: (url) => {
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        return socket as any;
      },
      formatTimestamp: () => '09:41',
      createId: (() => {
        let count = 0;
        return () => `msg-${count++}`;
      })(),
    });

    repository.setBackendHost('10.0.0.2');
    repository.activate();
    sockets[0].open();

    repository.submitTurn('first turn');
    expect(JSON.parse(sockets[0].sent[0])).toMatchObject({
      type: 'send_turn',
      session_id: 0,
      user_input: 'first turn',
      backend: 'glm5',
    });

    sockets[0].receive({
      type: 'turn_result',
      session_id: 123,
      status: 'CLARIFY',
      reply: 'Which game?',
    });

    repository.submitTurn('王者荣耀');
    expect(JSON.parse(sockets[0].sent[1])).toMatchObject({
      type: 'send_turn',
      session_id: 123,
      user_input: '王者荣耀',
      backend: 'glm5',
    });
  });

  it('reconnects with backoff and preserves queued turn state', () => {
    vi.useFakeTimers();
    const sockets: FakeWebSocket[] = [];
    const repository = new IntentConversationRepository({
      createSocket: (url) => {
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        return socket as any;
      },
      formatTimestamp: () => '09:41',
    });

    repository.setBackendHost('10.0.0.2');
    repository.activate();
    sockets[0].open();
    sockets[0].close();
    expect(repository.getSnapshot().uiState).toBe('connecting');
    repository.submitTurn('need help');

    vi.advanceTimersByTime(Math.min(1000, MAX_RECONNECT_DELAY_MS));
    expect(sockets).toHaveLength(2);
    sockets[1].open();

    expect(JSON.parse(sockets[1].sent[0])).toMatchObject({
      type: 'send_turn',
      session_id: 0,
      user_input: 'need help',
    });
    vi.useRealTimers();
  });

  it('handles backend error frames in a user-friendly way', () => {
    const sockets: FakeWebSocket[] = [];
    const repository = new IntentConversationRepository({
      createSocket: (url) => {
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        return socket as any;
      },
      formatTimestamp: () => '09:41',
    });

    repository.setBackendHost('10.0.0.2');
    repository.activate();
    sockets[0].open();
    repository.submitTurn('broken');
    sockets[0].receive({
      type: 'error',
      code: 'bad_request',
      message: 'Missing required field',
    });

    const snapshot = repository.getSnapshot();
    expect(snapshot.uiState).toBe('error');
    expect(snapshot.messages.at(-1)?.text).toContain('Missing required field');
  });

  it('renders DONE state with final_data', () => {
    const sockets: FakeWebSocket[] = [];
    const repository = new IntentConversationRepository({
      createSocket: (url) => {
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        return socket as any;
      },
      formatTimestamp: () => '09:41',
    });

    repository.setBackendHost('10.0.0.2');
    repository.activate();
    sockets[0].open();
    repository.submitTurn('我想打王者，网络正常就行');
    sockets[0].receive({
      type: 'turn_result',
      session_id: 333,
      status: 'DONE',
      reply: '已为你确认普通网络体验。',
      final_data: {
        app: '王者荣耀',
        network_profile: 'normal',
      },
    });

    const snapshot = repository.getSnapshot();
    expect(snapshot.uiState).toBe('done');
    expect(snapshot.sessionId).toBe(333);
    expect(snapshot.messages.at(-1)?.finalData).toMatchObject({
      app: '王者荣耀',
      network_profile: 'normal',
    });
  });

  it('builds the configured websocket url on port 7201', () => {
    expect(buildIntentBackendUrl('192.168.1.88')).toBe('ws://192.168.1.88:7201/api/ws');
  });

  it('sends heartbeat pings while connected', () => {
    vi.useFakeTimers();
    const sockets: FakeWebSocket[] = [];
    const repository = new IntentConversationRepository({
      createSocket: (url) => {
        const socket = new FakeWebSocket(url);
        sockets.push(socket);
        return socket as any;
      },
    });

    repository.setBackendHost('10.0.0.2');
    repository.activate();
    sockets[0].open();
    vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);

    expect(JSON.parse(sockets[0].sent[0])).toMatchObject({
      type: 'ping',
    });
    vi.useRealTimers();
  });
});
