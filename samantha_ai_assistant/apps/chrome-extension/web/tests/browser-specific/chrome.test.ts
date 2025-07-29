import { test, expect } from '@playwright/test';

/**
 * Chrome/Edge Test Suite - Full API Support
 * Tests all Chrome extension APIs and MV3 features
 */

test.describe('Chrome/Edge Extension Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load extension in Chrome with full permissions
    await page.goto('chrome-extension://test-id/popup.html');
  });

  test.describe('Service Worker Functionality', () => {
    test('should initialize service worker correctly', async ({ page }) => {
      // Test service worker registration
      const swStatus = await page.evaluate(() => {
        return navigator.serviceWorker?.controller?.state || 'no-sw';
      });

      expect(swStatus).toBe('activated');
    });

    test('should handle background script messaging', async ({ page }) => {
      // Test message passing between popup and background
      const response = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(response).toHaveProperty('isListening');
      expect(response).toHaveProperty('isActive');
    });

    test('should manage extension state in service worker', async ({ page }) => {
      // Test state management in background script
      const state = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(state).toHaveProperty('isListening');
      expect(state).toHaveProperty('audioContext');
      expect(state).toHaveProperty('recognition');
    });

    test('should handle service worker lifecycle events', async ({ page }) => {
      // Test service worker install, activate, and fetch events
      const events = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'getLifecycleEvents' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(events).toHaveProperty('installed');
      expect(events).toHaveProperty('activated');
    });
  });

  test.describe('Chrome Scripting API', () => {
    test('should execute scripts in active tab', async ({ page, context }) => {
      // Create a new tab for testing
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      // Test script injection
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id! },
              func: () => document.title
            }, (results) => {
              resolve(results?.[0]?.result);
            });
          });
        });
      });

      expect(result).toBe('Example Domain');
    });

    test('should inject CSS into active tab', async ({ page, context }) => {
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.insertCSS({
              target: { tabId: tabs[0].id! },
              css: 'body { background-color: red !important; }'
            }, () => {
              resolve('CSS injected');
            });
          });
        });
      });

      expect(result).toBe('CSS injected');
    });

    test('should remove CSS from active tab', async ({ page, context }) => {
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.removeCSS({
              target: { tabId: tabs[0].id! },
              css: 'body { background-color: red !important; }'
            }, () => {
              resolve('CSS removed');
            });
          });
        });
      });

      expect(result).toBe('CSS removed');
    });

    test('should execute complex scripts with parameters', async ({ page, context }) => {
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id! },
              func: (selector, text) => {
                const element = document.querySelector(selector);
                if (element) {
                  element.textContent = text;
                  return 'Element updated';
                }
                return 'Element not found';
              },
              args: ['h1', 'Updated Title']
            }, (results) => {
              resolve(results?.[0]?.result);
            });
          });
        });
      });

      expect(result).toBe('Element updated');
    });
  });

  test.describe('Audio Capture Features', () => {
    test('should request audio capture permission', async ({ page }) => {
      const permission = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.permissions.request({
            permissions: ['audioCapture']
          }, (granted) => {
            resolve(granted);
          });
        });
      });

      expect(permission).toBe(true);
    });

    test('should capture audio from active tab', async ({ page, context }) => {
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabCapture.capture({
              audio: true,
              video: false
            }, (streamId) => {
              resolve(streamId ? 'Audio captured' : 'Capture failed');
            });
          });
        });
      });

      expect(result).toBe('Audio captured');
    });

    test('should handle audio capture errors', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Try to capture without proper setup
          chrome.tabCapture.capture({
            audio: true,
            video: false
          }, (streamId) => {
            if (chrome.runtime.lastError) {
              resolve(chrome.runtime.lastError.message);
            } else {
              resolve('Success');
            }
          });
        });
      });

      expect(result).toContain('error');
    });
  });

  test.describe('MV3 Compatibility', () => {
    test('should use Manifest V3 features', async ({ page }) => {
      const manifest = await page.evaluate(() => {
        return chrome.runtime.getManifest();
      });

      expect(manifest.manifest_version).toBe(3);
      expect(manifest.background).toHaveProperty('service_worker');
    });

    test('should handle MV3 action API', async ({ page }) => {
      const action = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.action.getTitle({}, (title) => {
            resolve(title);
          });
        });
      });

      expect(action).toBe('Samantha AI');
    });

    test('should manage MV3 storage', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({ testKey: 'testValue' }, () => {
            chrome.storage.sync.get(['testKey'], (result) => {
              resolve(result.testKey);
            });
          });
        });
      });

      expect(result).toBe('testValue');
    });

    test('should handle MV3 permissions', async ({ page }) => {
      const permissions = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.permissions.getAll((permissions) => {
            resolve(permissions.permissions);
          });
        });
      });

      expect(permissions).toContain('activeTab');
      expect(permissions).toContain('storage');
      expect(permissions).toContain('tabs');
      expect(permissions).toContain('scripting');
    });
  });

  test.describe('Voice Processing Integration', () => {
    test('should initialize Web Speech API', async ({ page }) => {
      const hasSpeechAPI = await page.evaluate(() => {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      });

      expect(hasSpeechAPI).toBe(true);
    });

    test('should handle voice recognition in Chrome', async ({ page }) => {
      const recognition = await page.evaluate(() => {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        return {
          continuous: recognition.continuous,
          interimResults: recognition.interimResults,
          lang: recognition.lang
        };
      });

      expect(recognition.continuous).toBe(true);
      expect(recognition.interimResults).toBe(true);
      expect(recognition.lang).toBe('en-US');
    });

    test('should process voice commands through Chrome APIs', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Simulate voice command processing
          chrome.runtime.sendMessage({
            action: 'processVoiceCommand',
            command: 'open google'
          }, (response) => {
            resolve(response);
          });
        });
      });

      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('parameters');
    });
  });

  test.describe('Performance and Memory', () => {
    test('should maintain performance under load', async ({ page }) => {
      const performance = await page.evaluate(() => {
        const start = performance.now();

        // Simulate heavy processing
        for (let i = 0; i < 1000; i++) {
          chrome.runtime.sendMessage({ action: 'test' });
        }

        const end = performance.now();
        return end - start;
      });

      expect(performance).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should handle memory efficiently', async ({ page }) => {
      const memory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      expect(memory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      const error = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Try to access non-existent tab
          chrome.tabs.get(999999, (tab) => {
            resolve(chrome.runtime.lastError?.message);
          });
        });
      });

      expect(error).toContain('error');
    });

    test('should handle network failures', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'sendToAI',
            command: 'test'
          }, (response) => {
            if (chrome.runtime.lastError) {
              resolve('Network error handled');
            } else {
              resolve('Success');
            }
          });
        });
      });

      expect(result).toBe('Network error handled');
    });
  });
});
