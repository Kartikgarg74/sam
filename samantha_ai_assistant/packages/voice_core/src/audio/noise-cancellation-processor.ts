// [CONTEXT] AudioWorkletProcessor for Noise Cancellation
// This script runs in a separate audio thread.

import FFT from 'fft.js';

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

class NoiseCancellationProcessor extends AudioWorkletProcessor {
  private fft: FFT;
  private noiseProfile: Float32Array | null = null;
  private noiseEstimationFrames = 100;
  private currentFrame = 0;

  constructor(options?: AudioWorkletOptions) {
    super(options);
    const sampleRate = options?.processorOptions?.sampleRate || 16000;
    const bufferSize = options?.processorOptions?.bufferSize || 128; // FFT size
    this.fft = new FFT(bufferSize);

    this.port.onmessage = (event) => {
      if (event.data.command === 'initNoiseProfile') {
        this.noiseProfile = null; // Reset noise profile
        this.currentFrame = 0;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0 || !input[0] || input[0].length === 0) {
      return true;
    }

    const inputData = input[0]; // Assuming mono audio
    const outputData = output[0];

    const fftSize = this.fft.size;
    const numChunks = Math.floor(inputData.length / fftSize);

    for (let i = 0; i < numChunks; i++) {
      const offset = i * fftSize;
      const frame = inputData.slice(offset, offset + fftSize);

      if (this.noiseProfile === null) {
        // Estimate noise profile
        if (this.currentFrame < this.noiseEstimationFrames) {
          const spectrum = this.fft.createComplexArray();
          this.fft.realTransform(spectrum, frame);
          this.fft.completeSpectrum(spectrum);

          if (!this.noiseProfile) {
            this.noiseProfile = new Float32Array(spectrum.length / 2);
          }
          for (let j = 0; j < spectrum.length / 2; j++) {
            this.noiseProfile[j] += Math.sqrt(spectrum[j * 2] * spectrum[j * 2] + spectrum[j * 2 + 1] * spectrum[j * 2 + 1]);
          }
          this.currentFrame++;
        } else {
          // Average the noise profile
          if (this.noiseProfile) {
            const noiseProfile = this.noiseProfile as Float32Array; // Explicit assertion
            for (let j = 0; j < noiseProfile.length; j++) {
              noiseProfile[j] /= this.noiseEstimationFrames;
            }
          }
          console.log('Noise profile estimated:', this.noiseProfile);
        }
        // Pass through audio during noise estimation
        for (let j = 0; j < fftSize; j++) {
          outputData[offset + j] = frame[j];
        }
      } else {
        // Apply spectral subtraction
        const spectrum = this.fft.createComplexArray();
        this.fft.realTransform(spectrum, frame);
        this.fft.completeSpectrum(spectrum);

        for (let j = 0; j < spectrum.length / 2; j++) {
          const magnitude = Math.sqrt(spectrum[j * 2] * spectrum[j * 2] + spectrum[j * 2 + 1] * spectrum[j * 2 + 1]);
          const phase = Math.atan2(spectrum[j * 2 + 1], spectrum[j * 2]);

          // Simple spectral subtraction: magnitude - noise_magnitude
          // Ensure noiseProfile is not null before accessing its elements
          let newMagnitude = Math.max(0, magnitude - (this.noiseProfile ? this.noiseProfile[j] : 0));

          // Reconstruct complex number
          spectrum[j * 2] = newMagnitude * Math.cos(phase);
          spectrum[j * 2 + 1] = newMagnitude * Math.sin(phase);
        }

        const processedFrame = this.fft.createComplexArray();
        this.fft.inverseTransform(processedFrame, spectrum);

        for (let j = 0; j < fftSize; j++) {
          outputData[offset + j] = processedFrame[j];
        }
      }
    }

    return true; // Keep the processor alive
  }
}

registerProcessor('noise-cancellation-processor', NoiseCancellationProcessor);