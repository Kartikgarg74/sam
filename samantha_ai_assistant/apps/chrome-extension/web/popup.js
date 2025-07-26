// Popup JavaScript for Samantha AI Extension
class SamanthaAIPopup {
  constructor() {
    this.isListening = false;
    this.transcripts = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSettings();
    this.updateStatus();
  }

  bindEvents() {
    // Voice orb click
    document.getElementById('voiceOrb').addEventListener('click', () => {
      this.toggleListening();
    });

    // Control buttons
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startListening();
    });

    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stopListening();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearTranscript();
    });

    // Settings toggles
    document.getElementById('autoStartToggle').addEventListener('click', () => {
      this.toggleSetting('autoStart');
    });

    document.getElementById('voiceFeedbackToggle').addEventListener('click', () => {
      this.toggleSetting('voiceFeedback');
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleBackgroundMessage(request);
    });
  }

  async startListening() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'startListening' });
      if (response.success) {
        this.isListening = true;
        this.updateUI();
        this.addTranscript('🎤 Listening started...');
      }
    } catch (error) {
      console.error('Error starting listening:', error);
      this.addTranscript('❌ Error starting voice recognition');
    }
  }

  async stopListening() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'stopListening' });
      if (response.success) {
        this.isListening = false;
        this.updateUI();
        this.addTranscript('🛑 Listening stopped');
      }
    } catch (error) {
      console.error('Error stopping listening:', error);
      this.addTranscript('❌ Error stopping voice recognition');
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  updateUI() {
    const voiceOrb = document.getElementById('voiceOrb');
    const status = document.getElementById('status');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (this.isListening) {
      voiceOrb.classList.add('listening');
      status.textContent = 'Listening...';
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      voiceOrb.classList.remove('listening');
      status.textContent = 'Click to start listening';
      startBtn.disabled = false;
      stopBtn.disabled = true;
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
  }

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'autoStart',
        'voiceFeedback'
      ]);

      // Update toggle states
      document.getElementById('autoStartToggle').classList.toggle('active', settings.autoStart);
      document.getElementById('voiceFeedbackToggle').classList.toggle('active', settings.voiceFeedback !== false);

      // Auto-start if enabled
      if (settings.autoStart) {
        setTimeout(() => this.startListening(), 1000);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async toggleSetting(settingName) {
    try {
      const toggle = document.getElementById(`${settingName}Toggle`);
      const newValue = !toggle.classList.contains('active');

      toggle.classList.toggle('active', newValue);

      await chrome.storage.sync.set({ [settingName]: newValue });

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
      const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
      this.isListening = response.isListening;
      this.updateUI();
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
        this.addTranscript(`❌ ${request.message}`);
        break;
      case 'success':
        this.addTranscript(`✅ ${request.message}`);
        break;
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SamanthaAIPopup();
});
