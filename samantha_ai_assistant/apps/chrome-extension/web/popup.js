// Popup JavaScript for Samantha AI Extension
class SamanthaAIPopup {
  constructor() {
    this.isListening = false;
        this.transcripts = [];
    this.recognition = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSettings();
    this.updateStatus();
    this.initSpeechRecognition();
  }

    bindEvents() {
        // Voice orb click
        const voiceOrb = document.getElementById('voiceOrb');
        if (voiceOrb) {
            voiceOrb.addEventListener('click', () => {
                this.toggleListening();
            });
        }

        // Control buttons
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const clearBtn = document.getElementById('clearBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startListening();
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopListening();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearTranscript();
            });
        }

        // Settings toggles
        const autoStartToggle = document.getElementById('autoStartToggle');
        const voiceFeedbackToggle = document.getElementById('voiceFeedbackToggle');

        if (autoStartToggle) {
            autoStartToggle.addEventListener('click', () => {
                this.toggleSetting('autoStart');
            });
        }

        if (voiceFeedbackToggle) {
            voiceFeedbackToggle.addEventListener('click', () => {
                this.toggleSetting('voiceFeedback');
            });
        }

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleBackgroundMessage(request);
        });
    }

  initSpeechRecognition() {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                this.showError('❌ Speech recognition not supported in this browser');
        return;
      }

      this.recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        this.isListening = true;
        this.updateUI();
        this.addTranscript('🎤 Listening started...');
      };

      this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('Speech recognized:', transcript);
                this.addTranscript(`🎤 "${transcript}"`);
            this.processCommand(transcript);
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        this.updateUI();

        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = '❌ Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = '❌ No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = '❌ Audio capture failed. Please check your microphone.';
            break;
          case 'network':
            errorMessage = '❌ Network error. Please check your internet connection.';
            break;
          case 'service-not-allowed':
            errorMessage = '❌ Speech recognition service not allowed.';
            break;
          default:
            errorMessage = `❌ Speech recognition error: ${event.error}`;
        }
                this.showError(errorMessage);
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isListening = false;
        this.updateUI();
      };

      this.addTranscript('✅ Speech recognition initialized successfully');
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
            this.showError('❌ Failed to initialize speech recognition');
        }
  }

  async startListening() {
    try {
            // First, explicitly request microphone permission
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('Microphone permission granted');
                } catch (permissionError) {
                    console.error('Microphone permission denied:', permissionError);
                    this.showError('❌ Microphone access denied. Please allow microphone access in your browser settings.');
        return;
      }
            }

            // Notify background script that we're starting
            try {
                const response = await chrome.runtime.sendMessage({ action: 'startListening' });
                console.log('Background response:', response);
            } catch (error) {
                console.error('Error communicating with background:', error);
            }

            if (this.recognition && !this.isListening) {
      this.recognition.start();
                this.showSuccess('🎤 Started listening...');
            }
    } catch (error) {
      console.error('Error starting listening:', error);
            this.showError('❌ Error starting voice recognition');
    }
  }

  async stopListening() {
    try {
            // Notify background script that we're stopping
            try {
                const response = await chrome.runtime.sendMessage({ action: 'stopListening' });
                console.log('Background response:', response);
            } catch (error) {
                console.error('Error communicating with background:', error);
            }

      if (this.recognition && this.isListening) {
        this.recognition.stop();
                this.showSuccess('🛑 Stopped listening');
      }
    } catch (error) {
      console.error('Error stopping listening:', error);
            this.showError('❌ Error stopping voice recognition');
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  async processCommand(command) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'processCommand',
        command: command
      });

      if (response && response.success) {
                this.addTranscript(`✅ Processed: "${command}"`);
      } else {
                this.addTranscript(`❌ Failed to process: "${command}"`);
      }
    } catch (error) {
      console.error('Error processing command:', error);
            this.addTranscript(`❌ Error processing command: ${error.message}`);
    }
  }

  speakResponse(text) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
    }
  }

  updateUI() {
    const voiceOrb = document.getElementById('voiceOrb');
    const status = document.getElementById('status');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (voiceOrb) {
      if (this.isListening) {
        voiceOrb.classList.add('listening');
      } else {
        voiceOrb.classList.remove('listening');
      }
    }

    if (status) {
            status.textContent = this.isListening ? 'Listening...' : 'Click the globe to start listening';
    }

    if (startBtn) {
      startBtn.disabled = this.isListening;
    }

    if (stopBtn) {
      stopBtn.disabled = !this.isListening;
    }
  }

  addTranscript(text) {
    this.transcripts.push({
            text,
      timestamp: new Date().toLocaleTimeString()
    });
    this.updateTranscriptDisplay();
  }

  updateTranscriptDisplay() {
        const transcriptEl = document.getElementById('transcript');
        if (!transcriptEl) return;

        if (this.transcripts.length === 0) {
            transcriptEl.textContent = 'Your voice commands will appear here...';
            transcriptEl.classList.add('empty');
            return;
        }

        transcriptEl.classList.remove('empty');
        const displayText = this.transcripts
            .slice(-5) // Show last 5 transcripts
            .map(t => `[${t.timestamp}] ${t.text}`)
            .join('\n');

        transcriptEl.textContent = displayText;
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  clearTranscript() {
    this.transcripts = [];
    this.updateTranscriptDisplay();
        this.hideMessages();
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        const successEl = document.getElementById('successMessage');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 3000);
        }
    }

    hideMessages() {
        const errorEl = document.getElementById('errorMessage');
        const successEl = document.getElementById('successMessage');
        if (errorEl) errorEl.style.display = 'none';
        if (successEl) successEl.style.display = 'none';
  }

  async loadSettings() {
    try {
            const settings = await chrome.storage.local.get([
                'autoStart',
                'voiceFeedback'
            ]);

            // Update toggle states
            const autoStartToggle = document.getElementById('autoStartToggle');
            const voiceFeedbackToggle = document.getElementById('voiceFeedbackToggle');

            if (autoStartToggle) {
                autoStartToggle.classList.toggle('active', settings.autoStart);
            }

            if (voiceFeedbackToggle) {
                voiceFeedbackToggle.classList.toggle('active', settings.voiceFeedback !== false);
            }

            // Auto-start if enabled
            if (settings.autoStart) {
                setTimeout(() => this.startListening(), 1000);
            }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  updateSettingsUI() {
        this.loadSettings();
  }

  async toggleSetting(settingName) {
    try {
            const toggle = document.getElementById(`${settingName}Toggle`);
            if (!toggle) return;

            const newValue = !toggle.classList.contains('active');
            toggle.classList.toggle('active', newValue);

            await chrome.storage.local.set({ [settingName]: newValue });

            // Handle auto-start
            if (settingName === 'autoStart' && newValue) {
                this.addTranscript('✅ Auto-start enabled');
            } else if (settingName === 'autoStart' && !newValue) {
                this.addTranscript('❌ Auto-start disabled');
            }
    } catch (error) {
            console.error('Error saving setting:', error);
    }
  }

  async updateStatus() {
    try {
            const response = await chrome.runtime.sendMessage({
                action: 'getStatus'
            });

      if (response && response.success) {
        this.isListening = response.isListening;
        this.updateUI();
      }
    } catch (error) {
      console.error('Error getting status:', error);
    }
  }

  handleBackgroundMessage(request) {
        switch (request.type) {
            case 'transcript':
                this.addTranscript(`🎤 ${request.text}`);
                break;
            case 'error':
                this.showError(`❌ ${request.message}`);
                break;
            case 'success':
                this.showSuccess(`✅ ${request.message}`);
                break;
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SamanthaAIPopup();
});
