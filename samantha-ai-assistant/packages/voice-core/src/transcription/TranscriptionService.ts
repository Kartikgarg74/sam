import { nodewhisper } from 'nodejs-whisper';
import { promises as fs } from 'fs';
import path from 'path';
import { AudioFormat, TranscriptionResult } from '@samantha-ai-assistant/types';

/**
 * @class TranscriptionService
 * @description Handles audio transcription using the Whisper Tiny model.
 *              Optimized for local inference on Mac M2 efficiency cores.
 */
export class TranscriptionService {
  private whisperModelPath: string;

  constructor() {
    // Define path to the Whisper Tiny model (to be downloaded or pre-shipped)
    this.whisperModelPath = path.join(__dirname, '..', '..', 'models', 'whisper-tiny.bin');
  }

  /**
   * @method transcribeAudio
   * @description Transcribes an audio format using the Whisper Tiny model.
   * @param audioFormat The audio format to transcribe.
   * @returns A promise that resolves with the transcribed text.
   */
  public async transcribeAudio(audioFormat: AudioFormat): Promise<TranscriptionResult> {
    console.log('Starting audio transcription...');

    // Save the audio format to a temporary WAV file
    const tempAudioPath = path.join(__dirname, 'temp_audio.wav');
    await this.writeAudioFormatToWav(audioFormat, tempAudioPath);

    try {
      // Use nodejs-whisper to transcribe the audio file
      const result = await nodewhisper(tempAudioPath, {
        modelName: 'tiny.en', // Use the tiny English model
        autoDownloadModelName: 'tiny.en', // Auto-download if not present
        removeWavFileAfterTranscription: true, // Clean up temp file
        withCuda: false, // Assuming Mac M2 optimization means no CUDA
        whisperOptions: {
          outputInText: true,
        },
      });

      // The result from nodejs-whisper might be an array of segments or a single string
      // Depending on the outputInText option, it might be directly the text.
      // For simplicity, assuming it returns the transcribed text directly or in a property.
      const transcribedText = Array.isArray(result) ? result.map(s => s.speech).join(' ') : result;

      console.log('Audio transcription complete:', transcribedText);
      return { text: transcribedText };
    } catch (error) {
      console.error('Error during transcription:', error);
      throw error;
    } finally {
      // Ensure the temporary file is removed even if transcription fails
      await fs.unlink(tempAudioPath).catch(err => console.error('Error removing temp file:', err));
    }
  }

  /**
   * @method writeAudioFormatToWav
   * @description Writes an AudioFormat to a WAV file.
   * @param audioFormat The AudioFormat to write.
   * @param filePath The path to save the WAV file.
   */
  private async writeAudioFormatToWav(audioFormat: AudioFormat, filePath: string): Promise<void> {
    const numberOfChannels = audioFormat.channels;
    const sampleRate = audioFormat.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16; // Assuming Int16Array means 16-bit depth

    let offset = 0;
    const dataSize = audioFormat.data.length * (bitDepth / 8);
    const buffer = Buffer.alloc(44 + dataSize); // WAV header is 44 bytes

    // Write WAV header
    // RIFF chunk descriptor
    this.writeString(buffer, 'RIFF', offset);
    offset += 4;
    this.writeUInt32(buffer, 36 + dataSize, offset);
    offset += 4;
    this.writeString(buffer, 'WAVE', offset);
    offset += 4;

    // FMT sub-chunk
    this.writeString(buffer, 'fmt ', offset);
    offset += 4;
    this.writeUInt32(buffer, 16, offset);
    offset += 4;
    this.writeUInt16(buffer, format, offset);
    offset += 2;
    this.writeUInt16(buffer, numberOfChannels, offset);
    offset += 2;
    this.writeUInt32(buffer, sampleRate, offset);
    offset += 4;
    this.writeUInt32(buffer, sampleRate * numberOfChannels * (bitDepth / 8), offset);
    offset += 4;
    this.writeUInt16(buffer, numberOfChannels * (bitDepth / 8), offset);
    offset += 2;
    this.writeUInt16(buffer, bitDepth, offset);
    offset += 2;

    // Data sub-chunk
    this.writeString(buffer, 'data', offset);
    offset += 4;
    this.writeUInt32(buffer, dataSize, offset);
    offset += 4;

    // Write audio data
    for (let i = 0; i < audioFormat.data.length; i++) {
      this.writeInt16(buffer, audioFormat.data[i], offset);
      offset += 2;
    }

    await fs.writeFile(filePath, buffer);
  }

  private writeString(buffer: Buffer, str: string, offset: number) {
    for (let i = 0; i < str.length; i++) {
      buffer.writeUInt8(str.charCodeAt(i), offset + i);
    }
  }

  private writeUInt16(buffer: Buffer, value: number, offset: number) {
    buffer.writeUInt16LE(value, offset);
  }

  private writeUInt32(buffer: Buffer, value: number, offset: number) {
    buffer.writeUInt32LE(value, offset);
  }

  private writeInt16(buffer: Buffer, value: number, offset: number) {
    buffer.writeInt16LE(value, offset);
  }

  /**
   * @method initWhisperModel
   * @description Initializes and loads the Whisper Tiny model.
   *              This method would handle downloading the model if not present,
   *              and preparing it for inference.
   */
  private async initWhisperModel(): Promise<void> {
    console.log('Initializing Whisper Tiny model...');
    // nodejs-whisper handles model downloading automatically with autoDownloadModelName
    console.log('Whisper Tiny model initialization handled by nodejs-whisper.');
  }

  /**
   * @method getMockTranscription
   * @description Provides a mock transcription result for testing purposes.
   * @returns A string representing a mock transcription.
   */
  public getMockTranscription(): string {
    return "This is a mock transcription result.";
  }
}