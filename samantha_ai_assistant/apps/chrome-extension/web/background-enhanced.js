// Enhanced Background Service Worker for Samantha AI Extension
// Uses cross-browser voice processing with error handling and performance monitoring

class EnhancedSamanthaAIBackground {
  constructor() {
    this.isListening = false;
    this.voiceProcessor = null;
    this.errorHandler = null;
    this.performanceMonitor = null;
    this.currentMode = 'native';
    this.init();
  }

  async init() {
    try {
      console.log('Initializing Enhanced Samantha AI Background...');

      // Initialize cross-browser voice processor
      await this.initializeVoiceProcessor();

      // Initialize error handler
      this.errorHandler = new VoiceErrorHandler();

      // Initialize performance monitor
      this.performanceMonitor = new PerformanceMonitor();

      // Listen for extension events
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // Keep message channel open for async response
      });

      console.log('Enhanced background initialized successfully');
    } catch (error) {
      console.error('Failed to initialize enhanced background:', error);
      this.handleInitializationError(error);
    }
  }

  async initializeVoiceProcessor() {
    try {
      // Import the cross-browser voice processor
      // In a real implementation, this would be properly imported
      const { CrossBrowserVoiceProcessor } = await import('./cross-browser/CrossBrowserVoiceProcessor.js');

      this.voiceProcessor = new CrossBrowserVoiceProcessor({
        sampleRate: 16000,
        bufferSize: 4096,
        enableVAD: true,
        enableNoiseReduction: true
      });

      await this.voiceProcessor.initialize();

      // Set up event listeners
      this.voiceProcessor.on('initialized', (data) => {
        this.currentMode = data.mode;
        console.log(`Voice processor initialized in ${data.mode} mode`);
      });

      this.voiceProcessor.on('recordingStarted', () => {
        this.isListening = true;
        console.log('Voice recording started');
      });

      this.voiceProcessor.on('recordingStopped', () => {
        this.isListening = false;
        console.log('Voice recording stopped');
      });

      this.voiceProcessor.on('transcript', async (transcript) => {
        console.log('Transcript received:', transcript);
        await this.processVoiceCommand(transcript);
      });

      this.voiceProcessor.on('interimTranscript', (transcript) => {
        // Handle interim results for UI feedback
        console.log('Interim transcript:', transcript);
      });

      this.voiceProcessor.on('error', async (error) => {
        console.error('Voice processor error:', error);
        await this.handleVoiceError(error);
      });

    } catch (error) {
      console.error('Failed to initialize voice processor:', error);
      throw error;
    }
  }

  async processVoiceCommand(command) {
    try {
      this.performanceMonitor.startMeasurement();

      // Send command to AI processing
      const response = await this.sendToAI(command);

      // Record processing latency
      const processingLatency = this.performanceMonitor.recordProcessingLatency();

      // Execute browser automation based on AI response
      await this.executeBrowserAction(response);

      // Provide audio feedback
      await this.speakResponse(response.speech);

      // Record metrics
      this.performanceMonitor.recordMetrics({
        latency: {
          processing: processingLatency,
          total: this.performanceMonitor.recordProcessingLatency()
        },
        accuracy: {
          transcription: 0.95, // Placeholder
          intent: 0.9, // Placeholder
          execution: 1.0 // Placeholder
        },
        resources: {
          memory: await this.performanceMonitor.measureMemoryUsage(),
          cpu: await this.performanceMonitor.measureCPUUsage(),
          battery: 0.1 // Placeholder
        }
      });

    } catch (error) {
      console.error('Error processing voice command:', error);
      await this.handleVoiceError(error);
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
    if (this.voiceProcessor) {
      try {
        const audio = await this.voiceProcessor.synthesize(text);
        await this.voiceProcessor.playAudio(audio);
      } catch (error) {
        console.error('Failed to synthesize speech:', error);
        // Fallback to browser speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
      }
    } else {
      // Fallback to browser speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  }

  async handleVoiceError(error) {
    if (this.errorHandler) {
      const voiceError = {
        type: this.determineErrorType(error),
        message: error.message,
        browser: this.voiceProcessor?.getBrowserInfo()?.browserType || 'unknown',
        timestamp: Date.now()
      };

      const result = await this.errorHandler.handleError(voiceError);
      console.log('Error handling result:', result);
    }
  }

  determineErrorType(error) {
    if (error.message.includes('permission')) return 'PERMISSION_DENIED';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('API')) return 'API_UNAVAILABLE';
    if (error.message.includes('audio')) return 'AUDIO_CAPTURE_FAILED';
    if (error.message.includes('browser')) return 'BROWSER_UNSUPPORTED';
    return 'UNKNOWN';
  }

  async handleInitializationError(error) {
    console.error('Initialization error:', error);

    // Fallback to basic implementation
    this.initializeBasicFallback();
  }

  initializeBasicFallback() {
    console.log('Initializing basic fallback...');

    // Basic Web Speech API implementation
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.setupBasicSpeechRecognition();
    } else {
      console.error('No speech recognition available');
    }
  }

  setupBasicSpeechRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      console.log('Basic voice recognition started');
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
      console.error('Basic speech recognition error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      console.log('Basic voice recognition ended');
      this.isListening = false;
    };
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'startListening':
        if (this.voiceProcessor) {
          await this.voiceProcessor.startRecording();
        } else if (this.recognition) {
          this.recognition.start();
        }
        sendResponse({ success: true, mode: this.currentMode });
        break;

      case 'stopListening':
        if (this.voiceProcessor) {
          await this.voiceProcessor.stopRecording();
        } else if (this.recognition) {
          this.recognition.stop();
        }
        sendResponse({ success: true });
        break;

      case 'getStatus':
        sendResponse({
          isListening: this.isListening,
          isActive: true,
          mode: this.currentMode,
          browserInfo: this.voiceProcessor?.getBrowserInfo()
        });
        break;

      case 'getPerformanceReport':
        if (this.performanceMonitor) {
          const report = this.performanceMonitor.getPerformanceReport();
          sendResponse(report);
        } else {
          sendResponse({ error: 'Performance monitor not available' });
        }
        break;

      case 'getErrorStats':
        if (this.errorHandler) {
          const stats = this.errorHandler.getErrorStats();
          sendResponse(Array.from(stats.entries()));
        } else {
          sendResponse({ error: 'Error handler not available' });
        }
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }
}

// Initialize the enhanced background service
new EnhancedSamanthaAIBackground();
