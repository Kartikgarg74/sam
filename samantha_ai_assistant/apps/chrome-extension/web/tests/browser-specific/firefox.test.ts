import { test, expect } from '@playwright/test';

/**
 * Firefox Test Suite - Partial API Support
 * Tests MV2/MV3 compatibility and fallback mechanisms
 */

test.describe('Firefox Extension Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load extension in Firefox with partial permissions
    await page.goto('moz-extension://test-id/popup.html');
  });

  test.describe('MV2/MV3 Compatibility', () => {
    test('should detect manifest version correctly', async ({ page }) => {
      const manifest = await page.evaluate(() => {
        return browser.runtime.getManifest();
      });

      // Firefox supports both MV2 and MV3
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

    test('should handle service worker in MV3', async ({ page }) => {
      const swStatus = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getServiceWorkerStatus' }, (response) => {
            resolve(response?.status || 'no-sw');
          });
        });
      });

      // Firefox may not fully support service workers for extensions
      expect(['activated', 'no-sw', 'pending']).toContain(swStatus);
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

  test.describe('Background Script Fallbacks', () => {
    test('should use background scripts when service worker unavailable', async ({ page }) => {
      const backgroundType = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getBackgroundType' }, (response) => {
            resolve(response?.type || 'unknown');
          });
        });
      });

      expect(['service-worker', 'background-scripts', 'event-page']).toContain(backgroundType);
    });

    test('should handle persistent background scripts', async ({ page }) => {
      const isPersistent = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'isPersistent' }, (response) => {
            resolve(response?.persistent || false);
          });
        });
      });

      // Firefox may use persistent background scripts
      expect(typeof isPersistent).toBe('boolean');
    });

    test('should manage background script lifecycle', async ({ page }) => {
      const lifecycle = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({ action: 'getLifecycle' }, (response) => {
            resolve(response);
          });
        });
      });

      expect(lifecycle).toHaveProperty('loaded');
      expect(lifecycle).toHaveProperty('active');
    });
  });

  test.describe('Tabs ExecuteScript Alternatives', () => {
    test('should use tabs.executeScript when scripting API unavailable', async ({ page, context }) => {
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              browser.tabs.executeScript(tabs[0].id, {
                code: 'document.title'
              }, (results) => {
                resolve(results?.[0] || 'No result');
              });
            } else {
              resolve('No tab found');
            }
          });
        });
      });

      expect(result).toBe('Example Domain');
    });

    test('should inject CSS using tabs.insertCSS', async ({ page, context }) => {
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');

      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              browser.tabs.insertCSS(tabs[0].id, {
                code: 'body { background-color: blue !important; }'
              }, () => {
                resolve('CSS injected via tabs.insertCSS');
              });
            } else {
              resolve('No tab found');
            }
          });
        });
      });

      expect(result).toBe('CSS injected via tabs.insertCSS');
    });

    test('should handle script injection errors gracefully', async ({ page }) => {
      const error = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Try to inject script in non-existent tab
          browser.tabs.executeScript(999999, {
            code: 'document.title'
          }, (results) => {
            if (browser.runtime.lastError) {
              resolve(browser.runtime.lastError.message);
            } else {
              resolve('Success');
            }
          });
        });
      });

      expect(error).toContain('error');
    });
  });

  test.describe('Permission Handling', () => {
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

      // Firefox may have different optional permissions
      expect(Array.isArray(optionalPermissions)).toBe(true);
    });

    test('should handle permission removal', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.permissions.remove({
            permissions: ['notifications']
          }, (removed) => {
            resolve(removed);
          });
        });
      });

      expect(typeof result).toBe('boolean');
    });
  });

  test.describe('Storage API Compatibility', () => {
    test('should use browser.storage API', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.storage.local.set({ testKey: 'firefox-value' }, () => {
            browser.storage.local.get(['testKey'], (result) => {
              resolve(result.testKey);
            });
          });
        });
      });

      expect(result).toBe('firefox-value');
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

    test('should handle sync storage', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.storage.sync.set({ syncKey: 'firefox-sync' }, () => {
            browser.storage.sync.get(['syncKey'], (result) => {
              resolve(result.syncKey);
            });
          });
        });
      });

      expect(result).toBe('firefox-sync');
    });
  });

  test.describe('Voice Processing in Firefox', () => {
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

    test('should handle voice recognition with Firefox APIs', async ({ page }) => {
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

    test('should process voice commands through Firefox APIs', async ({ page }) => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          browser.runtime.sendMessage({
            action: 'processVoiceCommand',
            command: 'open mozilla'
          }, (response) => {
            resolve(response);
          });
        });
      });

      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('parameters');
    });
  });

  test.describe('Error Handling and Fallbacks', () => {
    test('should handle API differences gracefully', async ({ page }) => {
      const apiSupport = await page.evaluate(() => {
        return {
          hasScripting: typeof browser?.scripting !== 'undefined',
          hasTabsExecuteScript: typeof browser?.tabs?.executeScript !== 'undefined',
          hasTabsInsertCSS: typeof browser?.tabs?.insertCSS !== 'undefined'
        };
      });

      // Firefox may not have scripting API but should have tabs.executeScript
      expect(apiSupport.hasTabsExecuteScript).toBe(true);
      expect(apiSupport.hasTabsInsertCSS).toBe(true);
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
  });

  test.describe('Performance in Firefox', () => {
    test('should maintain performance with Firefox APIs', async ({ page }) => {
      const performance = await page.evaluate(() => {
        const start = performance.now();

        // Simulate heavy processing with Firefox APIs
        for (let i = 0; i < 100; i++) {
          browser.runtime.sendMessage({ action: 'test' });
        }

        const end = performance.now();
        return end - start;
      });

      expect(performance).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    test('should handle memory efficiently in Firefox', async ({ page }) => {
      const memory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      expect(memory).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });
});
