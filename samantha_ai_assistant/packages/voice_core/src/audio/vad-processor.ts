// [CONTEXT] AudioWorkletProcessor for Voice Activity Detection (VAD)
// This script runs in a separate audio thread.

import VAD from 'node-vad';

declare function registerProcessor(name: string, processorCtor: any): void;

declare class AudioWorkletProcessor extends EventTarget {
  readonly port: MessagePort;
  constructor(options?: AudioWorkletNodeOptions);
}

interface AudioWorkletOptions {
  numberOfInputs?: number;
  numberOfOutputs?: number;
  outputChannelCount?: number[];
  processorOptions?: any;
}

interface VADProcessorOptions extends AudioWorkletOptions {
  processorOptions: {
    sampleRate: number;
    vadMode?: VAD.Mode; // vadMode is optional as it has a default
  };
}

class VADProcessor extends AudioWorkletProcessor {
  private vad: VAD;
  private isRecording = false;
  private recordedAudioChunks: Int16Array[] = [];
  private sampleRate: number;

  constructor(options: VADProcessorOptions) {
    super();
    this.sampleRate = options.processorOptions.sampleRate;
    this.vad = new VAD(options.processorOptions.vadMode || VAD.Mode.NORMAL);

    this.port.onmessage = (event: MessageEvent) => {
      if (event.data.command === 'startRecording') {
        this.isRecording = true;
        this.recordedAudioChunks = [];
      } else if (event.data.command === 'stopRecording') {
        this.isRecording = false;
        const totalLength = this.recordedAudioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedAudio = new Int16Array(totalLength);
        let offset = 0;
        for (const chunk of this.recordedAudioChunks) {
          combinedAudio.set(chunk, offset);
          offset += chunk.length;
        }
        this.port.postMessage({ command: 'audioData', data: combinedAudio });
      } else if (event.data.command === 'setRecordingState') {
        this.isRecording = event.data.isRecording;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0) {
      const audioData = input[0]; // Get the first channel
      const pcmData = this.convertFloat32To16BitPCM(audioData);

      // Pass audio data through to output (for monitoring or further processing)
      for (let channel = 0; channel < input.length; channel++) {
        for (let i = 0; i < input[channel].length; i++) {
          output[channel][i] = input[channel][i];
        }
      }

      if (this.isRecording) {
        this.detectSpeech(pcmData).then((isSpeech) => {
          if (isSpeech) {
            this.recordedAudioChunks.push(pcmData);
            this.port.postMessage({ command: 'vadAudioData', data: pcmData });
          }
        }).catch((error) => {
          console.error('VADProcessor VAD error:', error);
          this.port.postMessage({ command: 'error', message: error.message });
        });
      }
    }
    return true; // Keep the processor alive
  }

  private convertFloat32To16BitPCM(rawData: Float32Array): Int16Array {
    const pcmData = new Int16Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      pcmData[i] = Math.max(-1, Math.min(1, rawData[i])) * 0x7fff;
    }
    return pcmData;
  }

  private async detectSpeech(pcmData: Int16Array): Promise<boolean> {
    const result = await this.vad.processAudio(pcmData.buffer, this.sampleRate);
    return result === VAD.Event.VOICE;
  }
}

registerProcessor('vad-processor', VADProcessor);
