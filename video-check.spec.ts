import { expect, test } from '@playwright/test';

test('root app and admin route render the unified flow', async ({ page }) => {
  await page.goto('http://localhost:7100');

  await expect(page.getByText('Presenter Controls')).toHaveCount(0);

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

  const input = page.getByTestId('intent-input');
  await page.getByTestId('intent-suggest').click();
  await expect(input).toHaveValue('I want to play Nitro Racer with smooth 4K gameplay.');
  await page.getByTestId('intent-send').click();

  await expect(page.getByText('Compute Nearby')).toBeVisible();
  await expect(page.getByTestId('intent-launch-card')).toBeVisible();
  await expect(page.getByTestId('intent-launch-confirm')).toHaveText('Deduct & Launch');

  await page.getByTestId('intent-launch-confirm').click();
  await expect(page.getByText('Android launch only')).toBeVisible();
  await expect(page.getByText('Moonlight handoff is available only inside the installed Android app.')).toBeVisible();

  await input.fill('Fix my buffering for this stream.');
  await page.getByTestId('intent-send').click();
  await expect(page.getByText('Video policy ACK')).toBeVisible();
  await expect(page.getByText('premium streaming policy')).toBeVisible();

  await page.goto('http://localhost:7100/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'Presenter Controls' })).toBeVisible();
  await expect(page.getByText('Internal Route')).toBeVisible();
  await expect(page.getByTestId('admin-open-app')).toBeVisible();

  await page.screenshot({ path: 'test-results/integration-check.png' });
});

test('mobile quick controls sheet works on the app route', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:7100');

  await expect(page.getByTestId('mobile-admin-trigger')).toBeVisible();
  await page.getByTestId('mobile-admin-trigger').click();
  await expect(page.getByText('Quick Presenter Panel')).toBeVisible();

  await page.getByTestId('mobile-admin-gaming').click();
  await expect(page.getByText('Cyber Void: Cloud Edition')).toBeVisible();

  await page.getByTestId('mobile-admin-trigger').click();
  await page.getByTestId('mobile-admin-degrade').click();
  await expect(page.getByText('CONNECTION UNSTABLE')).toBeVisible();

  await context.close();
});
