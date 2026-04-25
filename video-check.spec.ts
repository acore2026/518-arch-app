import { expect, test } from '@playwright/test';

const APP_URL = process.env.APP_URL ?? 'http://localhost:7100';

test('root app renders the unified flow and in-app controls', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('playwright-storage-reset')) {
      window.localStorage.clear();
      window.sessionStorage.setItem('playwright-storage-reset', '1');
    }

    class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = MockWebSocket.CONNECTING;
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent<string>) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;

      constructor(public url: string) {
        (window as any).__sentTurns = (window as any).__sentTurns ?? [];
        window.setTimeout(() => {
          this.readyState = MockWebSocket.OPEN;
          this.onopen?.(new Event('open'));
        }, 20);
      }

      send(data: string) {
        const frame = JSON.parse(data);
        if (frame.type === 'ping') {
          window.setTimeout(() => {
            this.onmessage?.({
              data: JSON.stringify({ type: 'pong' }),
            } as MessageEvent<string>);
          }, 5);
          return;
        }

        if (frame.type === 'send_turn') {
          (window as any).__sentTurns.push(frame);
          if (frame.user_input === 'Apply premium QoS now.') {
            window.setTimeout(() => {
              this.onmessage?.({
                data: JSON.stringify({
                  type: 'error',
                  code: 'bad_request',
                  message: 'Unable to interpret the requested QoS policy',
                }),
              } as MessageEvent<string>);
            }, 20);
            return;
          }

          window.setTimeout(() => {
            this.onmessage?.({
              data: JSON.stringify({
                type: 'turn_result',
                session_id: frame.session_id && frame.session_id > 0 ? frame.session_id : 123,
                status: 'DONE',
                reply: 'Core network system agent accepted the intent and reserved a policy workflow.',
                final_data: {
                  profile: 'normal',
                  backend: frame.backend,
                },
              }),
            } as MessageEvent<string>);
          }, 20);
        }
      }

      close() {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ code: 1000 } as CloseEvent);
      }
    }

    window.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  await page.goto(APP_URL);

  const video = page.getByTestId('streaming-video');
  await expect(video).toBeVisible();
  await expect(page.getByText('Elden Ring: Shadow of the Erdtree - 4K Gameplay')).toBeVisible();

  const src = await video.getAttribute('src');
  expect(src).toContain('vjs.zencdn.net');

  await page.getByTestId('experience-menu-button').click();
  await page.getByTestId('experience-option-gaming').click();
  await expect(page.getByText('Cyber Void: Cloud Edition')).toBeVisible();
  await expect(page.getByTestId('cloud-game-canvas')).toBeVisible();

  await page.getByTestId('experience-menu-button').click();
  await page.getByTestId('experience-option-intent').click();
  await expect(page.getByTestId('intent-suggest')).toBeVisible();
  await expect(page.getByTestId('intent-backend-status')).toHaveText('Stub Mode');

  const input = page.getByTestId('intent-input');
  await page.getByTestId('intent-suggest').click();
  await expect(input).toHaveValue('I want to play Nitro Racer with smooth 4K gameplay.');
  await page.getByRole('button', { name: 'compute' }).click();
  await page.getByTestId('intent-send').click();

  await expect(page.getByText('Compute Nearby', { exact: true })).toBeVisible();
  await expect(page.getByText("I've detected available 'Network Computing' capabilities nearby.")).toBeVisible();
  await expect(page.getByTestId('intent-launch-card')).toHaveCount(1);
  await expect(page.getByText('Android launch only')).toHaveCount(0);
  await page.getByTestId('intent-launch-confirm').click();
  await expect(page.getByText('Android launch only')).toBeVisible();
  await expect(page.getByText('Moonlight handoff is available only inside the installed Android app.')).toBeVisible();

  await input.fill('Fix my buffering for this stream.');
  await page.getByTestId('intent-send').click();
  await expect(page.getByText('Video policy ACK')).toBeVisible();
  await expect(page.getByText('Acknowledged: Network experience intent')).toBeVisible();

  await input.fill('Allocate edge compute for rendering.');
  await page.getByRole('button', { name: 'compute' }).click();
  await page.getByTestId('intent-send').click();
  await expect(page.getByText('Acknowledged: Compute resource intent')).toBeVisible();

  await page.getByTestId('controls-trigger').click();
  await expect(page.getByRole('heading', { level: 2, name: 'Control Panel' })).toBeVisible();
  await expect(page.getByTestId('system-agent-status')).toHaveText('Stub mode');
  await page.getByTestId('system-agent-endpoint-input').fill('system-agent.example.com');
  await page.getByTestId('system-agent-save').click();
  await expect(page.getByTestId('system-agent-status')).toHaveText('Connected');

  await page.reload();
  await page.getByTestId('controls-trigger').click();
  await expect(page.getByTestId('system-agent-status')).toHaveText('Disconnected');
  await expect(page.getByTestId('system-agent-endpoint-input')).toHaveValue('system-agent.example.com');
  await page.getByRole('button', { name: 'Close controls' }).click();
  await page.getByTestId('experience-menu-button').click();
  await page.getByTestId('experience-option-intent').click();
  await expect(page.getByTestId('intent-backend-status')).toHaveText('Connected');

  await input.fill('Prioritize this gaming session.');
  await page.getByRole('button', { name: 'experience' }).click();
  await page.getByTestId('intent-send').click();
  await expect(page.getByText('Intent Confirmed')).toBeVisible();
  await expect(page.getByText('reserved a policy workflow')).toBeVisible();
  await expect(page.getByText('Final Data')).toBeVisible();
  await expect(page.getByTestId('intent-launch-card')).toHaveCount(0);

  const turnsBeforeComputeGame = await page.evaluate(() => (window as any).__sentTurns.length);
  await input.fill('I want to play 王者荣耀.');
  await page.getByRole('button', { name: 'compute' }).click();
  await page.getByTestId('intent-send').click();
  await expect(page.getByText('Compute Nearby').last()).toBeVisible();
  await expect(page.getByTestId('intent-launch-card')).toHaveCount(1);
  await expect(page.getByText('Android launch only')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (window as any).__sentTurns.length))
    .toBe(turnsBeforeComputeGame);

  await input.fill('Apply premium QoS now.');
  await page.getByRole('button', { name: 'experience' }).click();
  await page.getByTestId('intent-send').click();
  await expect(page.getByText('System Agent Error')).toBeVisible();
  await expect(page.getByText('Unable to interpret the requested QoS policy. Please try again.')).toBeVisible();

  await page.screenshot({ path: 'test-results/integration-check.png' });
});

test('controls sheet works on the app route on mobile', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  await page.goto(APP_URL);

  await expect(page.getByTestId('controls-trigger')).toBeVisible();
  await page.getByTestId('controls-trigger').click();
  await expect(page.getByText('Control Panel')).toBeVisible();

  await page.getByTestId('controls-gaming').click();
  await expect(page.getByText('Cyber Void: Cloud Edition')).toBeVisible();

  await page.getByTestId('controls-trigger').click();
  await page.getByTestId('controls-degrade').click();
  await expect(page.getByText('CONNECTION UNSTABLE')).toBeVisible();

  await context.close();
});
