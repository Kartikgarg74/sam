// Background Service Worker for Samantha AI Extension
class SamanthaAIBackground {
  constructor() {
    this.isListening = false;
    this.audioContext = null;
    this.mediaStream = null;
    this.recognition = null;
    this.init();
  }

  async init() {
    // Initialize voice recognition
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.setupSpeechRecognition();
    }

    // Listen for extension events
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  setupSpeechRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      console.log('Voice recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[0].isFinal) {
        this.processVoiceCommand(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      console.log('Voice recognition ended');
      this.isListening = false;
    };
  }

  async processVoiceCommand(command) {
    try {
      // Send command to AI processing
      const response = await this.sendToAI(command);

      // Execute browser automation based on AI response
      await this.executeBrowserAction(response);

      // Provide audio feedback
      await this.speakResponse(response.speech);

    } catch (error) {
      console.error('Error processing voice command:', error);
    }
  }

  async sendToAI(command) {
    // TODO: Integrate with your AI service
    const response = await fetch('https://your-ai-endpoint.com/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: command,
        context: await this.getCurrentContext()
      })
    });

    return await response.json();
  }

  async getCurrentContext() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return {
      url: tab.url,
      title: tab.title,
      domain: new URL(tab.url).hostname
    };
  }

  async executeBrowserAction(aiResponse) {
    const { action, target, value } = aiResponse;

    switch (action) {
      case 'navigate':
        await this.navigateToPage(value);
        break;
      case 'click':
        await this.clickElement(target);
        break;
      case 'type':
        await this.typeText(target, value);
        break;
      case 'scroll':
        await this.scrollPage(value);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  async navigateToPage(url) {
    await chrome.tabs.create({ url });
  }

  async clickElement(selector) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (selector) => {
        const element = document.querySelector(selector);
        if (element) element.click();
      },
      args: [selector]
    });
  }

  async typeText(selector, text) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (selector, text) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      args: [selector, text]
    });
  }

  async scrollPage(direction) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (direction) => {
        const scrollAmount = direction === 'up' ? -100 : 100;
        window.scrollBy(0, scrollAmount);
      },
      args: [direction]
    });
  }

  async speakResponse(text) {
    // Use browser's speech synthesis
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'startListening':
        if (!this.isListening) {
          this.recognition.start();
        }
        sendResponse({ success: true });
        break;

      case 'stopListening':
        if (this.isListening) {
          this.recognition.stop();
        }
        sendResponse({ success: true });
        break;

      case 'getStatus':
        sendResponse({
          isListening: this.isListening,
          isActive: true
        });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }
}

// Initialize the background service
new SamanthaAIBackground();
