import { test, expect } from '@playwright/test';

test.describe('Voice Commands E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the extension popup
    await page.goto('chrome-extension://test-id/popup.html');
  });

  test('should start listening when voice orb is clicked', async ({ page }) => {
    // Click the voice orb to start listening
    await page.click('[data-testid="voice-orb"]');

    // Check that listening state is active
    await expect(page.locator('[data-testid="voice-orb"]')).toHaveClass(/listening/);
    await expect(page.locator('[data-testid="status"]')).toHaveText('Listening...');
  });

  test('should stop listening when stop button is clicked', async ({ page }) => {
    // Start listening
    await page.click('[data-testid="voice-orb"]');

    // Stop listening
    await page.click('[data-testid="stop-btn"]');

    // Check that listening state is inactive
    await expect(page.locator('[data-testid="voice-orb"]')).not.toHaveClass(/listening/);
    await expect(page.locator('[data-testid="status"]')).toHaveText('Click to start listening');
  });

  test('should display transcript when voice is recognized', async ({ page }) => {
    // Mock speech recognition result
    await page.evaluate(() => {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.onresult({
        results: [{
          isFinal: true,
          transcript: 'open google'
        }]
      });
    });

    // Check that transcript is displayed
    await expect(page.locator('[data-testid="transcript"]')).toContainText('open google');
  });

  test('should execute navigation command', async ({ page, context }) => {
    // Mock AI response for navigation command
    await page.route('**/ai-endpoint/process', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          action: 'navigate',
          target: null,
          value: 'https://google.com',
          speech: 'Opening Google'
        })
      });
    });

    // Simulate voice command
    await page.evaluate(() => {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.onresult({
        results: [{
          isFinal: true,
          transcript: 'open google'
        }]
      });
    });

    // Wait for new tab to be created
    await expect(async () => {
      const pages = context.pages();
      const googlePage = pages.find(p => p.url().includes('google.com'));
      expect(googlePage).toBeDefined();
    }).toPass();
  });

  test('should execute click command', async ({ page }) => {
    // Mock AI response for click command
    await page.route('**/ai-endpoint/process', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          action: 'click',
          target: '#submit-button',
          value: null,
          speech: 'Clicking submit button'
        })
      });
    });

    // Simulate voice command
    await page.evaluate(() => {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.onresult({
        results: [{
          isFinal: true,
          transcript: 'click submit button'
        }]
      });
    });

    // Check that click action was executed
    await expect(page.locator('[data-testid="action-log"]')).toContainText('click');
  });

  test('should execute type command', async ({ page }) => {
    // Mock AI response for type command
    await page.route('**/ai-endpoint/process', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          action: 'type',
          target: '#search-input',
          value: 'Samantha AI',
          speech: 'Typing Samantha AI'
        })
      });
    });

    // Simulate voice command
    await page.evaluate(() => {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.onresult({
        results: [{
          isFinal: true,
          transcript: 'type samantha ai'
        }]
      });
    });

    // Check that type action was executed
    await expect(page.locator('[data-testid="action-log"]')).toContainText('type');
  });

  test('should handle speech recognition errors', async ({ page }) => {
    // Mock speech recognition error
    await page.evaluate(() => {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.onerror({
        error: 'no-speech'
      });
    });

    // Check that error is displayed
    await expect(page.locator('[data-testid="transcript"]')).toContainText('Error');
  });

  test('should provide audio feedback', async ({ page }) => {
    // Mock AI response with speech feedback
    await page.route('**/ai-endpoint/process', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          action: 'navigate',
          target: null,
          value: 'https://example.com',
          speech: 'Navigating to example.com'
        })
      });
    });

    // Simulate voice command
    await page.evaluate(() => {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.onresult({
        results: [{
          isFinal: true,
          transcript: 'go to example'
        }]
      });
    });

    // Check that speech synthesis was called
    await expect(page.locator('[data-testid="feedback"]')).toContainText('Navigating to example.com');
  });

  test('should save settings to storage', async ({ page }) => {
    // Toggle auto-start setting
    await page.click('[data-testid="auto-start-toggle"]');

    // Check that setting is saved
    const storage = await page.evaluate(() => {
      return chrome.storage.sync.get(['autoStart']);
    });

    expect(storage.autoStart).toBe(true);
  });

  test('should load settings from storage', async ({ page }) => {
    // Set storage value
    await page.evaluate(() => {
      chrome.storage.sync.set({ autoStart: true, voiceFeedback: false });
    });

    // Reload page
    await page.reload();

    // Check that settings are loaded
    await expect(page.locator('[data-testid="auto-start-toggle"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="voice-feedback-toggle"]')).not.toHaveClass(/active/);
  });
});

test.describe('Cross-Browser Voice Recognition', () => {
  test('should work on Chrome', async ({ page }) => {
    await page.goto('chrome-extension://test-id/popup.html');

    // Test Chrome-specific voice features
    await expect(page.locator('[data-testid="voice-orb"]')).toBeVisible();

    // Chrome has full Web Speech API support
    const hasSpeechRecognition = await page.evaluate(() => {
      return 'webkitSpeechRecognition' in window;
    });

    expect(hasSpeechRecognition).toBe(true);
  });

  test('should work on Firefox', async ({ page }) => {
    await page.goto('chrome-extension://test-id/popup.html');

    // Test Firefox-specific voice features
    await expect(page.locator('[data-testid="voice-orb"]')).toBeVisible();

    // Firefox has limited Web Speech API support
    const hasSpeechRecognition = await page.evaluate(() => {
      return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    });

    expect(hasSpeechRecognition).toBe(true);
  });

  test('should work on Safari', async ({ page }) => {
    await page.goto('chrome-extension://test-id/popup.html');

    // Test Safari-specific voice features
    await expect(page.locator('[data-testid="voice-orb"]')).toBeVisible();

    // Safari has Web Speech API support
    const hasSpeechRecognition = await page.evaluate(() => {
      return 'webkitSpeechRecognition' in window;
    });

    expect(hasSpeechRecognition).toBe(true);
  });
});
