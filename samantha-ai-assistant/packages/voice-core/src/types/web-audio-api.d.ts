declare module 'web-audio-api' {
  export class AudioContext {
    constructor();
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
  }

  export interface AudioBuffer {
    getChannelData(channel: number): Float32Array;
    readonly sampleRate: number;
    readonly length: number;
    readonly duration: number;
    readonly numberOfChannels: number;
    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void;
    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void;
  }
}