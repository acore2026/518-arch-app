import { expect, test } from '@playwright/test';

test('streaming, gaming, and direct intent demos render', async ({ page }) => {
  await page.goto('http://localhost:7100');

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
  await expect(input).toHaveValue('Fix my buffering for this stream.');
  await page.getByTestId('intent-send').click();
  await expect(page.getByText('Video policy ACK')).toBeVisible();
  await expect(page.getByText('premium streaming policy')).toBeVisible();

  await input.fill('Please brew me a coffee.');
  await page.getByTestId('intent-send').click();
  await expect(page.getByText('Fallback ACK')).toBeVisible();
  await expect(page.getByText('could not map it to a known policy template')).toBeVisible();

  await page.getByTestId('experience-menu-button').click();
  await page.getByTestId('experience-option-gaming').click();
  await expect(page.getByText('Cyber Void: Cloud Edition')).toBeVisible();
  await expect(page.getByText('Standard 5G (Best Effort)')).toBeVisible();
  await expect(page.getByText('CONNECTION UNSTABLE')).toHaveCount(0);

  await page.screenshot({ path: 'test-results/integration-check.png' });
});
