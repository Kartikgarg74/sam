// Cross-Browser Voice Processor Implementation
// Hybrid approach using native APIs with fallbacks

import { EventEmitter } from 'events';
import { AudioFormat, CommandResult, ConversationContext } from '@samantha-ai-assistant/types';

interface VoiceProcessorOptions {
  sampleRate?: number;
  bufferSize?: number;
  enableVAD?: boolean;
  enableNoiseReduction?: boolean;
}

interface BrowserCapabilities {
  hasWebkitSpeechRecognition: boolean;
  hasSpeechRecognition: boolean;
  hasAudioContext: boolean;
  hasGetUserMedia: boolean;
  hasMediaRecorder: boolean;
  hasSpeechSynthesis: boolean;
  hasTabCapture: boolean;
  browserType: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
}

export class CrossBrowserVoiceProcessor extends EventEmitter {
  private options: VoiceProcessorOptions;
  private capabilities: BrowserCapabilities;
  private recognition: any;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private isRecording = false;
  private recordedChunks: Int16Array[] = [];

  constructor(options: VoiceProcessorOptions = {}) {
    super();
    this.options = {
      sampleRate: 16000,
      bufferSize: 4096,
      enableVAD: true,
      enableNoiseReduction: true,
      ...options
    };
    this.capabilities = this.detectBrowserCapabilities();
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing CrossBrowserVoiceProcessor...');
      console.log('Browser capabilities:', this.capabilities);

      if (this.supportsNativeSpeechRecognition()) {
        await this.initializeNativeSpeechRecognition();
      } else if (this.supportsCustomAudioProcessing()) {
        await this.initializeCustomAudioProcessing();
      } else {
        throw new Error('No supported voice processing method available');
      }

      this.emit('initialized', { mode: this.getCurrentMode() });
    } catch (error) {
      console.error('Failed to initialize voice processor:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private detectBrowserCapabilities(): BrowserCapabilities {
    const userAgent = navigator.userAgent.toLowerCase();
    let browserType: BrowserCapabilities['browserType'] = 'unknown';

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      browserType = 'chrome';
    } else if (userAgent.includes('firefox')) {
      browserType = 'firefox';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      browserType = 'safari';
    } else if (userAgent.includes('edg')) {
      browserType = 'edge';
    }

    return {
      hasWebkitSpeechRecognition: 'webkitSpeechRecognition' in window,
      hasSpeechRecognition: 'SpeechRecognition' in window,
      hasAudioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
      hasGetUserMedia: 'getUserMedia' in navigator.mediaDevices,
      hasMediaRecorder: 'MediaRecorder' in window,
      hasSpeechSynthesis: 'speechSynthesis' in window,
      hasTabCapture: typeof chrome !== 'undefined' && chrome.tabCapture !== undefined,
      browserType
    };
  }

  private supportsNativeSpeechRecognition(): boolean {
    return this.capabilities.hasWebkitSpeechRecognition || this.capabilities.hasSpeechRecognition;
  }

  private supportsCustomAudioProcessing(): boolean {
    return this.capabilities.hasAudioContext && this.capabilities.hasGetUserMedia;
  }

  private getCurrentMode(): 'native' | 'custom' | 'fallback' {
    if (this.recognition) return 'native';
    if (this.audioContext) return 'custom';
    return 'fallback';
  }

  private async initializeNativeSpeechRecognition(): Promise<void> {
    // Get the appropriate SpeechRecognition constructor
    const SpeechRecognitionClass = this.getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      throw new Error('SpeechRecognition not available');
    }

    this.recognition = new SpeechRecognitionClass();
    this.setupSpeechRecognition();
  }

  private getSpeechRecognitionClass(): any {
    // Chrome/Edge/Safari
    if (this.capabilities.hasWebkitSpeechRecognition) {
      return (window as any).webkitSpeechRecognition;
    }
    // Firefox
    if (this.capabilities.hasSpeechRecognition) {
      return (window as any).SpeechRecognition;
    }
    return null;
  }

  private setupSpeechRecognition(): void {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log('Native speech recognition started');
      this.isRecording = true;
      this.emit('recordingStarted');
    };

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');

      if (event.results[0].isFinal) {
        this.emit('transcript', transcript);
        this.processTranscript(transcript);
      } else {
        this.emit('interimTranscript', transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isRecording = false;
      this.emit('error', new Error(`Speech recognition error: ${event.error}`));
    };

    this.recognition.onend = () => {
      console.log('Native speech recognition ended');
      this.isRecording = false;
      this.emit('recordingStopped');
    };
  }

  private async initializeCustomAudioProcessing(): Promise<void> {
    try {
      // Initialize AudioContext
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        sampleRate: this.options.sampleRate
      });

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.options.enableNoiseReduction,
          noiseSuppression: this.options.enableNoiseReduction,
          autoGainControl: true,
          sampleRate: this.options.sampleRate
        }
      });

      // Create audio processing pipeline
      await this.setupCustomAudioProcessing();

    } catch (error) {
      console.error('Failed to initialize custom audio processing:', error);
      throw error;
    }
  }

  private async setupCustomAudioProcessing(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('AudioContext or MediaStream not available');
    }

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    const processor = this.audioContext.createScriptProcessor(
      this.options.bufferSize,
      1, // input channels
      1  // output channels
    );

    processor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);

      // Convert to Int16Array for processing
      const int16Data = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }

      this.recordedChunks.push(int16Data);
      this.emit('audioData', int16Data);

      // Simple VAD (Voice Activity Detection)
      if (this.options.enableVAD) {
        const isVoice = this.detectVoiceActivity(inputData);
        if (isVoice) {
          this.emit('voiceDetected', int16Data);
        }
      }
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);
  }

  private detectVoiceActivity(audioData: Float32Array): boolean {
    // Simple energy-based VAD
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
    }
    energy /= audioData.length;

    // Threshold-based detection
    const threshold = 0.01; // Adjust based on testing
    return energy > threshold;
  }

  async startRecording(): Promise<void> {
    if (this.recognition) {
      // Native speech recognition
      this.recognition.start();
    } else if (this.audioContext) {
      // Custom audio processing
      this.isRecording = true;
      this.recordedChunks = [];
      this.emit('recordingStarted');
    } else {
      throw new Error('No recording method available');
    }
  }

  async stopRecording(): Promise<AudioFormat> {
    if (this.recognition) {
      this.recognition.stop();
      // Return empty audio format for native recognition
      return {
        data: new Int16Array(0),
        sampleRate: this.options.sampleRate || 16000,
        channels: 1,
        mimeType: 'audio/pcm'
      };
    } else if (this.audioContext && this.isRecording) {
      this.isRecording = false;
      const combinedAudio = this.combineAudioChunks(this.recordedChunks);
      this.recordedChunks = [];
      this.emit('recordingStopped');

      return {
        data: combinedAudio,
        sampleRate: this.options.sampleRate || 16000,
        channels: 1,
        mimeType: 'audio/pcm'
      };
    } else {
      throw new Error('No recording method available');
    }
  }

  private combineAudioChunks(chunks: Int16Array[]): Int16Array {
    if (chunks.length === 0) {
      return new Int16Array(0);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Int16Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  private async processTranscript(transcript: string): Promise<void> {
    try {
      this.emit('processing', transcript);

      // Here you would integrate with your AI processing pipeline
      // For now, we'll emit the transcript for external processing
      this.emit('transcriptProcessed', {
        text: transcript,
        confidence: 0.9, // Placeholder
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error processing transcript:', error);
      this.emit('error', error);
    }
  }

  async synthesize(text: string): Promise<AudioFormat> {
    if (this.capabilities.hasSpeechSynthesis) {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // For now, return empty audio format
        // In a real implementation, you'd capture the synthesized audio
        utterance.onend = () => {
          resolve({
            data: new Int16Array(0),
            sampleRate: 22050,
            channels: 1,
            mimeType: 'audio/pcm'
          });
        };

        speechSynthesis.speak(utterance);
      });
    } else {
      throw new Error('Speech synthesis not supported');
    }
  }

  async playAudio(audio: AudioFormat): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    // Convert Int16Array to AudioBuffer
    const audioBuffer = this.audioContext.createBuffer(
      audio.channels,
      audio.data.length,
      audio.sampleRate
    );

    for (let channel = 0; channel < audio.channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audio.data.length; i++) {
        channelData[i] = audio.data[i] / 32768; // Convert to float
      }
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();

    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  }

  getBrowserInfo(): BrowserCapabilities {
    return { ...this.capabilities };
  }

  getPerformanceMetrics(): any {
    return {
      mode: this.getCurrentMode(),
      browser: this.capabilities.browserType,
      isRecording: this.isRecording,
      audioContextState: this.audioContext?.state || 'none',
      sampleRate: this.audioContext?.sampleRate || this.options.sampleRate
    };
  }

  release(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isRecording = false;
    this.recordedChunks = [];
  }
}
