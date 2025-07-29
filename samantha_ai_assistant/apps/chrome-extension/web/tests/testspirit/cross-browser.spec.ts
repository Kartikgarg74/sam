import { test, expect } from '@testspirit/playwright';

test.describe('TestSpirit Cross-Browser Smoke Test', () => {
  test('should load extension popup and show UI elements', async ({ page }) => {
    await page.goto('chrome-extension://test-id/popup.html');
    await expect(page.locator('[data-testid="voice-orb"]')).toBeVisible();
    await expect(page.locator('[data-testid="status"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-btn"]')).toBeVisible();
  });
});
