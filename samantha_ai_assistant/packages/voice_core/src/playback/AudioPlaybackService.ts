// [CONTEXT] Handles audio playback through native macOS audio output.

import { AudioFormat } from '@samantha-ai-assistant/types';
import * as sound from 'sound-play';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class AudioPlaybackService {
  constructor() {
    console.log('AudioPlaybackService initialized.');
  }

  /**
   * @function playAudio
   * @description Plays the given audio buffer through native macOS audio output.
   * @param {AudioFormat} audio - The audio buffer to play.
   * @returns {Promise<void>} A promise that resolves when audio playback is complete.
   */
  public async playAudio(audio: AudioFormat): Promise<void> {
    console.log('Playing audio...');

    // [CONTEXT] sound-play requires a file path, so we need to write the audio buffer to a temporary file.
    const tempFileName = `temp_audio_${uuidv4()}.wav`;
    const tempFilePath = path.join('/tmp', tempFileName); // Use /tmp for temporary files

    try {
      // [PURPOSE] Write the audio data to a temporary WAV file.
      // For simplicity, assuming audio.data is a Buffer or can be converted to one.
      // In a real scenario, you might need to handle different audio formats (e.g., MP3) and convert them to WAV.
      fs.writeFileSync(tempFilePath, Buffer.from(audio.data));

      // [PURPOSE] Play the audio file using sound-play.
      await sound.play(tempFilePath);
      console.log('Audio playback finished.');
    } catch (error) {
      console.error('Error during audio playback:', error);
      throw error;
    } finally {
      // [PURPOSE] Clean up the temporary file.
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  // [PURPOSE] Placeholder for shutdown logic if needed.
  public shutdown(): void {
    console.log('AudioPlaybackService shutdown.');
  }
}

}