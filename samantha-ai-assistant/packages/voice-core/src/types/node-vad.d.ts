declare module 'node-vad' {
  class VAD {
    constructor(mode: VAD.Mode);
    processAudio(samples: ArrayBuffer, sampleRate: number): Promise<VAD.Event>;
    static createStream(options: VAD.StreamOptions): any; // Simplified for now
  }

  namespace VAD {
    enum Mode {
      NORMAL = 0,
      LOW_BITRATE = 1,
      AGGRESSIVE = 2,
      VERY_AGGRESSIVE = 3,
    }

    enum Event {
      ERROR = 0,
      SILENCE = 1,
      VOICE = 2,
      NOISE = 3,
    }

    interface StreamOptions {
      mode?: Mode;
      audioFrequency?: number;
      debounceTime?: number;
    }
  }

  export default VAD;
}