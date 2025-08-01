// [CONTEXT] Core audio management system for voice processing pipeline
import { AudioFormat } from '@samantha-ai-assistant/types';
 import VAD from 'node-vad';
 import EventEmitter from 'events';
 import { PvRecorder } from '@picovoice/pvrecorder-node';

interface AudioManagerOptions {
  sampleRate?: number;
  bufferSize?: number;
  vadMode?: VAD.Mode;
}

export class AudioManager extends EventEmitter {
  private options: AudioManagerOptions;
  private sampleRate: number;
  private bufferSize: number;
  private vad: VAD;

  private isRecording = false;
  private recordedAudioChunks: Int16Array[] = [];
  private recorder?: PvRecorder;

  constructor(options: AudioManagerOptions = {}) {
    super();
    this.sampleRate = options.sampleRate || 16000; // Optimized for speech
    this.bufferSize = options.bufferSize || 4096; // Balance latency and performance
    this.options = options;
    this.vad = new VAD(options.vadMode || VAD.Mode.NORMAL);
  }

  // [PURPOSE] Initialize audio system and request microphone permissions
  async initialize(): Promise<void> {
    try {
      const devices = PvRecorder.getAvailableDevices();
      if (devices.length === 0) {
        throw new Error('No audio input devices found.');
      }
      // Use the default device (index 0) or allow configuration
      this.recorder = new PvRecorder(this.bufferSize, 0); // frameLength, deviceIndex
      this.recorder.start();

      // Start reading audio frames in a loop
      this.isRecording = true;
      this.readAudioFrames();

    } catch (error) {
      console.error('Audio initialization failed:', error);
      throw error;
    }
  }

  // [PURPOSE] Start/stop audio capture with VAD
  startRecording(): void {
    this.recordedAudioChunks = []; // Clear previous recordings
    this.isRecording = true;
    if (this.recorder && !this.recorder.isRecording) {
      this.recorder.start();
      this.readAudioFrames();
    }
  }

  stopRecording(): Promise<AudioFormat> {
    this.isRecording = false;
    return new Promise((resolve) => {
      if (this.recorder) {
        this.recorder.stop();
        this.recorder.release();
        this.recorder = undefined;
      }
      const combinedAudio = this.concatenateAudioChunks(this.recordedAudioChunks);
      this.recordedAudioChunks = []; // Clear chunks after combining
      resolve({
        data: combinedAudio,
        sampleRate: this.sampleRate,
        channels: 1,
        mimeType: 'audio/pcm',
      });
    });
  }



  // [PURPOSE] Clean up audio resources
  shutdown(): void {
    this.stopRecording();
    if (this.recorder) {
      this.recorder.release();
      this.recorder = undefined;
    }
    this.vad = null as any; // Clear reference
   }

   private async readAudioFrames(): Promise<void> {
     while (this.isRecording && this.recorder) {
       try {
         const frame = await this.recorder.read();
         const audioData = new Int16Array(frame);
         this.recordedAudioChunks.push(audioData);
         this.emit('audioData', {
           data: audioData,
           sampleRate: this.sampleRate,
           channels: 1,
           mimeType: 'audio/pcm',
         });
       } catch (error) {
         console.error('Error reading audio frame:', error);
         this.isRecording = false; // Stop recording on error
       }
     }
     while (this.isRecording && this.recorder) {
        try {
            const frame = await this.recorder.read();
            const audioData = new Int16Array(frame);
            // Process audio data with VAD
            const vadResult = this.vad.processAudio(audioData);
            this.emit(VAD.Event.VAD_RESULT, vadResult);
            if (vadResult === VAD.Event.VOICE) {
                this.recordedAudioChunks.push(audioData);
                this.emit('audioData', {
                    data: audioData,
                    sampleRate: this.sampleRate,
                    channels: 1,
                    mimeType: 'audio/pcm',
                });
                this.emit(VAD.Event.VOICE, audioData);
            } else if (vadResult === VAD.Event.SILENCE) {
                // Handle silence, e.g., check for end of speech
                // For now, we just don't push silence to recordedAudioChunks
            }
        } catch (error) {
            console.error('Error reading audio frame:', error);
            this.isRecording = false; // Stop recording on error
        }
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to prevent busy-waiting
    }
   }

   private concatenateAudioChunks(chunks: Int16Array[]): Int16Array {
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
}
