import { test, expect } from '@playwright/test';

test('video source should be correctly set', async ({ page }) => {
  await page.goto('http://localhost:7100');

  const video = page.locator('video');
  await expect(video).toBeVisible();

  const src = await video.getAttribute('src');
  console.log('Video source:', src);
  expect(src).toContain('vjs.zencdn.net');
  
  await page.screenshot({ path: 'final-check.png' });
});
