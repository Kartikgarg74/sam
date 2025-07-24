// [CONTEXT] Manages microphone input, noise cancellation, and Voice Activity Detection (VAD).



import { AudioFormat } from '@samantha-ai-assistant/types';
import { PvRecorder } from '@picovoice/pvrecorder-node';

export class AudioManager {
  private recorder: PvRecorder | null = null;
  private audioData: Int16Array[] = [];
  private recording: boolean = false;
  private recordingInterval: NodeJS.Timeout | null = null;
  private readonly frameLength: number = 512; // PvRecorder default frame length
  private readonly sampleRate: number = 16000; // PvRecorder default sample rate

  constructor() {
    // Initialize PvRecorder but do not start recording immediately
    try {
      this.recorder = new PvRecorder(this.frameLength, 0); // 0 for default device
      console.log(`PvRecorder initialized. Version: ${this.recorder.version}, Audio Devices: ${JSON.stringify(PvRecorder.getAudioDevices())}`);
    } catch (e) {
      console.error("Failed to initialize PvRecorder:", e);
    }
  }

  startRecording(): void {
    if (!this.recorder) {
      console.error("Recorder not initialized.");
      return;
    }
    if (this.recording) {
      console.log("Already recording.");
      return;
    }

    this.audioData = [];
    this.recording = true;
    this.recorder.start();
    console.log('Starting audio recording with PvRecorder...');

    this.recordingInterval = setInterval(() => {
      try {
        const frame = this.recorder!.read();
        this.audioData.push(frame);
      } catch (e) {
        console.error("Error reading audio frame:", e);
        this.stopRecording(); // Stop recording on error
      }
    }, this.frameLength * 1000 / this.sampleRate); // Interval based on frame length and sample rate
  }

  stopRecording(): AudioFormat {
    if (!this.recorder || !this.recording) {
      console.error("Recorder not active or not recording.");
      return {
        data: new Int16Array(),
        sampleRate: this.sampleRate,
        channels: 1,
        mimeType: 'audio/wav',
        duration: 0,
      };
    }

    console.log('Stopping audio recording with PvRecorder...');
    this.recording = false;
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
    this.recorder.stop();

    const combinedAudioData = new Int16Array(this.audioData.flat());
    const duration = combinedAudioData.length / this.sampleRate; // Duration in seconds

    return {
      data: combinedAudioData,
      sampleRate: this.sampleRate,
      channels: 1, // PvRecorder typically captures mono audio
      mimeType: 'audio/wav', // Assuming WAV format for raw PCM
      duration: duration,
    };
  }

  applyNoiseCancellation(audioData: AudioFormat): AudioFormat {
    // Placeholder for noise cancellation logic
    console.log('Applying noise cancellation...');
    return audioData;
  }

  detectVoiceActivity(audioData: AudioFormat): boolean {
    // Placeholder for voice activity detection logic
    console.log('Detecting voice activity...');
    return true;
  }

  // Add a method to release PvRecorder resources when no longer needed
  release(): void {
    if (this.recorder) {
      this.recorder.release();
      this.recorder = null;
      console.log('PvRecorder resources released.');
    }
  }
}