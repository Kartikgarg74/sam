// Background Service Worker for Samantha AI Extension
class SamanthaAIBackground {
  constructor() {
    this.isListening = false;
    this.init();
  }

  async init() {
    // Listen for extension events
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Listen for content script ready messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'contentScriptReady') {
        console.log('Content script ready on:', request.url);
      }
    });
  }

  async processVoiceCommand(command) {
    try {
      console.log('Processing voice command:', command);

      // Get current tab context
      const context = await this.getCurrentContext();

      // Simple command processing (you can enhance this)
      const response = await this.processCommand(command, context);

      // Execute browser automation based on response
      await this.executeBrowserAction(response);

      // Send response back to popup
      return { success: true, response: response };

    } catch (error) {
      console.error('Error processing voice command:', error);
      return { success: false, error: error.message };
    }
  }

  async processCommand(command, context) {
    // Simple command processing - you can enhance this with AI
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('click') || lowerCommand.includes('press')) {
      return { action: 'click', target: 'button', value: command };
    }

    if (lowerCommand.includes('type') || lowerCommand.includes('enter')) {
      return { action: 'type', target: 'input', value: command };
    }

    if (lowerCommand.includes('scroll')) {
      const direction = lowerCommand.includes('up') ? 'up' : 'down';
      return { action: 'scroll', direction: direction };
    }

    if (lowerCommand.includes('go to') || lowerCommand.includes('navigate')) {
      const url = this.extractUrl(command);
      return { action: 'navigate', url: url };
    }

    return { action: 'speak', message: `I heard: ${command}` };
  }

  extractUrl(command) {
    // Simple URL extraction - enhance as needed
    if (command.includes('google')) return 'https://google.com';
    if (command.includes('youtube')) return 'https://youtube.com';
    if (command.includes('github')) return 'https://github.com';
    return 'https://google.com'; // default
  }

  async getCurrentContext() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return {
        url: tab.url,
        title: tab.title,
        domain: new URL(tab.url).hostname
      };
    } catch (error) {
      console.error('Error getting context:', error);
      return { url: '', title: '', domain: '' };
    }
  }

  async executeBrowserAction(aiResponse) {
    try {
      const { action, target, value, direction, url } = aiResponse;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      switch (action) {
        case 'click':
          await chrome.tabs.sendMessage(tab.id, {
            action: 'clickElement',
            selector: target
          });
          break;

        case 'type':
          await chrome.tabs.sendMessage(tab.id, {
            action: 'typeText',
            selector: target,
            text: value
          });
          break;

        case 'scroll':
          await chrome.tabs.sendMessage(tab.id, {
            action: 'scrollPage',
            direction: direction || 'down'
          });
          break;

        case 'navigate':
          await chrome.tabs.update(tab.id, { url: url });
          break;

        case 'speak':
          // Send message to popup for speech synthesis
          chrome.runtime.sendMessage({
            action: 'speakResponse',
            text: value || aiResponse.message
          });
          break;

        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error executing browser action:', error);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    console.log('Background received message:', request);

    try {
      switch (request.action) {
        case 'startListening':
          this.isListening = true;
          console.log('Background: Listening started');
          sendResponse({ success: true, message: 'Listening started', isListening: true });
          break;

        case 'stopListening':
          this.isListening = false;
          console.log('Background: Listening stopped');
          sendResponse({ success: true, message: 'Listening stopped', isListening: false });
          break;

        case 'processCommand':
          const result = await this.processVoiceCommand(request.command);
          sendResponse(result);
          break;

        case 'getStatus':
          console.log('Background: Status requested, isListening:', this.isListening);
          sendResponse({
            success: true,
            isListening: this.isListening,
            status: this.isListening ? 'active' : 'inactive'
          });
          break;

        case 'clearHistory':
          // Clear stored data
          await chrome.storage.local.clear();
          sendResponse({ success: true, message: 'History cleared' });
          break;

        case 'speakResponse':
          // Handle speech synthesis requests
          console.log('Background: Speech synthesis requested:', request.text);
          sendResponse({ success: true, message: 'Speech synthesis handled' });
          break;

        default:
          console.log('Background: Unknown action:', request.action);
          sendResponse({ success: false, message: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
}

// Initialize the background service worker
new SamanthaAIBackground();
