import { test, expect } from '@testspirit/playwright';

test.describe('TestSpirit Voice Command', () => {
  test('should process "open google" voice command and navigate', async ({ page, context, ai }) => {
    // Simulate user saying "open google" using TestSpirit's AI voice API
    await page.goto('chrome-extension://test-id/popup.html');

    // Use TestSpirit's AI to synthesize and inject the voice command
    await ai.speak('open google');

    // Wait for the extension to process and act
    await expect(page.locator('[data-testid="transcript"]')).toContainText('open google');

    // Check that navigation was triggered (mocked or real)
    // In a real test, you might check for a new tab or navigation event
    // Here, we check for a status update or confirmation message
    await expect(page.locator('[data-testid="status"]')).toHaveText(/Opening Google|Navigating to google/i);
  });
});
