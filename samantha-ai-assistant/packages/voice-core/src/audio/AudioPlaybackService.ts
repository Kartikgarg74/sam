// [CONTEXT] Manages audio playback for the voice processing pipeline

class AudioPlaybackService {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    // Initialize audio playback resources
  }

  async playAudio(audioData: Int16Array): Promise<void> {
    const audioBuffer = this.audioContext.createBuffer(
      1, // number of channels
      audioData.length, // length of the buffer
      this.audioContext.sampleRate // sample rate
    );

    const nowBuffering = audioBuffer.getChannelData(0);
    for (let i = 0; i < audioData.length; i++) {
      nowBuffering[i] = audioData[i] / 32768; // Normalize Int16 to float32
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();

    return new Promise((resolve) => {
      source.onended = () => {
        resolve();
      };
    });
  }

  shutdown(): void {
    // Clean up resources
  }
}

export default AudioPlaybackService;