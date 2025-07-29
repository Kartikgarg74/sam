import { test, expect } from '@playwright/test';

/**
 * Safari Test Suite - Limited API Support
 * Tests MV2/MV3 compatibility and fallback mechanisms
 */

test.describe('Safari Extension Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load extension in Safari with limited permissions
    await page.goto('safari-extension://test-id/popup.html');
  });

  test.describe('MV2/MV3 Compatibility', () => {
    test('should detect manifest version correctly', async ({ page }) => {
      const manifest = await page.evaluate(() => {
        return browser.runtime.getManifest();
      });

      // Safari supports both MV2 and MV3
      expect([2, 3]).toContain(manifest.manifest_version);
    });

    test('should handle background scripts in MV2', async ({ page }) => {
      const backgroundScripts = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getBackgroundScripts' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(backgroundScripts).toHaveProperty('scripts');
    });

    test('should handle service worker limitations in MV3', async ({ page }) => {
      const swStatus = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getServiceWorkerStatus' }, (response) => {
            resolve(response?.status || 'no-sw');
          });
        });
      });

      // Safari has limited service worker support for extensions
      expect(['activated', 'no-sw', 'pending', 'limited']).toContain(swStatus);
    });

    test('should use browser.* namespace', async ({ page }) => {
      const namespace = await page.evaluate(() => {
        return {
          hasBrowser: typeof browser !== 'undefined',
          hasChrome: typeof chrome !== 'undefined',
          runtime: typeof browser?.runtime !== 'undefined',
          tabs: typeof browser?.tabs !== 'undefined'
        };
      });

      expect(namespace.hasBrowser).toBe(true);
      expect(namespace.runtime).toBe(true);
      expect(namespace.tabs).toBe(true);
    });
  });

  test.describe('API Fallback Mechanisms', () => {
    test('should provide fallback for scripting API', async ({ page }) => {
      const scriptingFallback = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getScriptingFallback' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(scriptingFallback).toHaveProperty('available');
      expect(scriptingFallback).toHaveProperty('method');
    });

    test('should handle missing chrome.scripting API', async ({ page }) => {
      const hasScripting = await page.evaluate(() => {
        return typeof browser?.scripting !== 'undefined';
      });

      // Safari may not have scripting API
      expect(typeof hasScripting).toBe('boolean');
    });

    test('should use alternative script injection methods', async ({ page, context }) => {
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({
            action: 'injectScriptAlternative',
            target: 'activeTab',
            code: 'document.title'
          }, (response) => {
            resolve(response?.result || 'No result');
          });
        });
      });

      expect(result).toBe('Example Domain');
    });

    test('should handle content script injection', async ({ page, context }) => {
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({
            action: 'injectContentScript',
            target: 'activeTab'
          }, (response) => {
            resolve(response?.success || false);
          });
        });
      });

      expect(result).toBe(true);
    });
  });

  test.describe('Audio Alternatives', () => {
    test('should detect audio capture limitations', async ({ page }) => {
      const audioSupport = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getAudioSupport' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(audioSupport).toHaveProperty('tabCapture');
      expect(audioSupport).toHaveProperty('getUserMedia');
      expect(audioSupport).toHaveProperty('fallback');
    });

    test('should use getUserMedia as audio fallback', async ({ page }) => {
      const audioMethod = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getAudioMethod' }, (response) => {
            resolve(response?.method || 'none');
          });
        });
      });

      expect(['tabCapture', 'getUserMedia', 'fallback']).toContain(audioMethod);
    });

    test('should handle audio permission requests', async ({ page }) => {
      const permission = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.permissions.request({
            permissions: ['microphone']
          }, (granted) => {
            resolve(granted);
          });
        });
      });

      expect(typeof permission).toBe('boolean');
    });

    test('should provide audio feedback alternatives', async ({ page }) => {
      const audioFeedback = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getAudioFeedback' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(audioFeedback).toHaveProperty('speechSynthesis');
      expect(audioFeedback).toHaveProperty('audioFiles');
      expect(audioFeedback).toHaveProperty('fallback');
    });
  });

  test.describe('Storage and Permission Tests', () => {
    test('should use browser.storage API', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.storage.local.set({ testKey: 'safari-value' }, () => {
            browser.storage.local.get(['testKey'], (result) => {
              resolve(result.testKey);
            });
          });
        });
      });

      expect(result).toBe('safari-value');
    });

    test('should handle storage events', async ({ page }) => {
      const events = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.storage.onChanged.addListener((changes, namespace) => {
            resolve({ changes, namespace });
          });

          // Trigger a storage change
          browser.storage.local.set({ eventTest: 'triggered' });
        });
      });

      expect(events).toHaveProperty('changes');
      expect(events).toHaveProperty('namespace');
    });

    test('should handle sync storage limitations', async ({ page }) => {
      const syncSupport = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.storage.sync.get(['test'], (result) => {
            resolve({
              hasSync: typeof browser.storage.sync !== 'undefined',
              result: result
            });
          });
        });
      });

      expect(syncSupport.hasSync).toBe(true);
    });

    test('should request permissions correctly', async ({ page }) => {
      const permission = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.permissions.request({
            permissions: ['activeTab']
          }, (granted) => {
            resolve(granted);
          });
        });
      });

      expect(permission).toBe(true);
    });

    test('should check permission status', async ({ page }) => {
      const permissions = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.permissions.getAll((permissions) => {
            resolve(permissions.permissions);
          });
        });
      });

      expect(permissions).toContain('activeTab');
      expect(permissions).toContain('storage');
      expect(permissions).toContain('tabs');
    });

    test('should handle optional permissions', async ({ page }) => {
      const optionalPermissions = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.permissions.getAll((permissions) => {
            resolve(permissions.optionalPermissions || []);
          });
        });
      });

      // Safari may have different optional permissions
      expect(Array.isArray(optionalPermissions)).toBe(true);
    });
  });

  test.describe('Voice Processing in Safari', () => {
    test('should detect Web Speech API support', async ({ page }) => {
      const speechSupport = await page.evaluate(() => {
        return {
          webkitSpeechRecognition: 'webkitSpeechRecognition' in window,
          speechRecognition: 'SpeechRecognition' in window,
          speechSynthesis: 'speechSynthesis' in window
        };
      });

      expect(speechSupport.webkitSpeechRecognition || speechSupport.speechRecognition).toBe(true);
      expect(speechSupport.speechSynthesis).toBe(true);
    });

    test('should handle voice recognition with Safari APIs', async ({ page }) => {
      const recognition = await page.evaluate(() => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          return {
            continuous: recognition.continuous,
            interimResults: recognition.interimResults,
            lang: recognition.lang
          };
        }
        return null;
      });

      if (recognition) {
        expect(recognition.continuous).toBe(true);
        expect(recognition.interimResults).toBe(true);
        expect(recognition.lang).toBe('en-US');
      }
    });

    test('should process voice commands through Safari APIs', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({
            action: 'processVoiceCommand',
            command: 'open safari'
          }, (response) => {
            resolve(response);
          });
        });
      });

      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('parameters');
    });

    test('should handle speech synthesis in Safari', async ({ page }) => {
      const synthesis = await page.evaluate(() => {
        return new Promise((resolve) => {
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Test message');
            utterance.onend = () => resolve('Synthesis completed');
            speechSynthesis.speak(utterance);
          } else {
            resolve('No synthesis support');
          }
        });
      });

      expect(synthesis).toBe('Synthesis completed');
    });
  });

  test.describe('UI and Interaction Tests', () => {
    test('should render popup UI correctly', async ({ page }) => {
      await expect(page.locator('[data-testid="voice-orb"]')).toBeVisible();
      await expect(page.locator('[data-testid="status"]')).toBeVisible();
      await expect(page.locator('[data-testid="transcript"]')).toBeVisible();
    });

    test('should handle voice orb interactions', async ({ page }) => {
      await page.click('[data-testid="voice-orb"]');
      await expect(page.locator('[data-testid="voice-orb"]')).toHaveClass(/listening/);

      await page.click('[data-testid="stop-btn"]');
      await expect(page.locator('[data-testid="voice-orb"]')).not.toHaveClass(/listening/);
    });

    test('should manage settings toggles', async ({ page }) => {
      await page.click('[data-testid="auto-start-toggle"]');
      await expect(page.locator('[data-testid="auto-start-toggle"]')).toHaveClass(/active/);

      await page.click('[data-testid="voice-feedback-toggle"]');
      await expect(page.locator('[data-testid="voice-feedback-toggle"]')).toHaveClass(/active/);
    });

    test('should display transcripts correctly', async ({ page }) => {
      await page.evaluate(() => {
        // Simulate voice recognition result
        const event = new CustomEvent('speechResult', {
          detail: { transcript: 'Test voice command' }
        });
        window.dispatchEvent(event);
      });

      await expect(page.locator('[data-testid="transcript"]')).toContainText('Test voice command');
    });
  });

  test.describe('Error Handling and Fallbacks', () => {
    test('should handle API limitations gracefully', async ({ page }) => {
      const limitations = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getAPILimitations' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(limitations).toHaveProperty('scripting');
      expect(limitations).toHaveProperty('audioCapture');
      expect(limitations).toHaveProperty('serviceWorker');
    });

    test('should provide fallback for unsupported features', async ({ page }) => {
      const fallbacks = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getFeatureFallbacks' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(fallbacks).toHaveProperty('scripting');
      expect(fallbacks).toHaveProperty('audioCapture');
      expect(fallbacks).toHaveProperty('serviceWorker');
    });

    test('should handle runtime errors properly', async ({ page }) => {
      const error = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Try to access non-existent API
          browser.runtime.sendMessage({ action: 'testNonExistentAPI' }, (response) => {
            if (browser.runtime.lastError) {
              resolve(browser.runtime.lastError.message);
            } else {
              resolve('No error');
            }
          });
        });
      });

      expect(error).toContain('error');
    });

    test('should handle network failures gracefully', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({
            action: 'sendToAI',
            command: 'test'
          }, (response) => {
            if (browser.runtime.lastError) {
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

  test.describe('Performance in Safari', () => {
    test('should maintain performance with Safari APIs', async ({ page }) => {
      const performance = await page.evaluate(() => {
        const start = performance.now();

        // Simulate heavy processing with Safari APIs
        for (let i = 0; i < 50; i++) {
          browser.runtime.sendMessage({ action: 'test' });
        }

        const end = performance.now();
        return end - start;
      });

      expect(performance).toBeLessThan(3000); // Should complete in under 3 seconds
    });

    test('should handle memory efficiently in Safari', async ({ page }) => {
      const memory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      expect(memory).toBeLessThan(150 * 1024 * 1024); // Less than 150MB
    });

    test('should handle battery efficiently', async ({ page }) => {
      const battery = await page.evaluate(() => {
        return new Promise((resolve) => {
          if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
              resolve({
                level: battery.level,
                charging: battery.charging
              });
            });
          } else {
            resolve(null);
          }
        });
      });

      if (battery) {
        expect(battery).toHaveProperty('level');
        expect(battery).toHaveProperty('charging');
      }
    });
  });
});
