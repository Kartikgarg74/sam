// [CONTEXT] Manages the flow of audio data through the voice processing pipeline.

import { TranscriptionResult, CommandResult, ExecutionResult } from '@samantha-ai-assistant/types';
import { AudioManager } from './audioManager.js';
import { TranscriptionService } from './transcriptionService.js';
import { ResponseSynthesisService } from './responseSynthesis.js';
import { AudioPlaybackService } from './audioPlayback.js';

/**
 * @class AudioPipeline
 * @description Orchestrates the flow of audio data through the voice processing pipeline.
 */
export class AudioPipeline {
  private audioManager: AudioManager;
  private transcriptionService: TranscriptionService;
  private responseSynthesisService: ResponseSynthesisService;
  private audioPlaybackService: AudioPlaybackService;

  constructor() {
    this.audioManager = new AudioManager();
    this.transcriptionService = new TranscriptionService();
    this.responseSynthesisService = new ResponseSynthesisService();
    this.audioPlaybackService = new AudioPlaybackService();
    console.log("AudioPipeline initialized.");
  }

  /**
   * @method processAudioStream
   * @description Processes an incoming audio stream through transcription, command processing, response synthesis, and audio playback.
   * @param {AudioBuffer} audio - The incoming audio buffer.
   * @returns {Promise<void>} A promise that resolves when the audio stream has been processed.
   */
  public async processAudioStream(audio: AudioBuffer): Promise<void> {
    console.log("Processing audio stream...");

    // 1. Transcribe audio
    const transcriptionResult: TranscriptionResult = await this.transcriptionService.transcribe(audio);
    console.log("Transcription Result:", transcriptionResult.text);

    // 2. Process command (Placeholder for now)
    const commandResult: CommandResult = { intent: "", parameters: {} }; // Replace with actual command processing
    console.log("Command Result:", commandResult);

    // 3. Synthesize response (Placeholder for now)
    const synthesizedAudio: AudioBuffer = await this.responseSynthesisService.synthesize("This is a dummy response."); // Replace with actual response synthesis
    console.log("Synthesized Audio:", synthesizedAudio);

    // 4. Play audio
    await this.audioPlaybackService.playAudio(synthesizedAudio);
    console.log("Audio playback complete.");
  }
}