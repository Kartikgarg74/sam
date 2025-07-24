// [CONTEXT] Core voice processing pipeline for Samantha AI Assistant

/**
 * @interface VoiceProcessingPipeline
 * @description Defines the core interface for the voice processing pipeline,
 * handling audio capture, transcription, command processing, response synthesis, and audio playback.
 */
export interface VoiceProcessingPipeline {
  // No constructor parameters are exposed in the interface as VoiceCore now instantiates its dependencies internally.
  /**
   * @function startRecording
   * @description Starts audio recording from the microphone.
   */
  startRecording(): Promise<void>;

  /**
   * @function stopRecording
   * @description Stops audio recording and returns the captured audio buffer.
   * @returns {Promise<AudioFormat>} A promise that resolves with the captured audio buffer.
   */
  stopRecording(): Promise<AudioFormat>;

  /**
   * @function processAudio
   * @description Processes the given audio buffer through transcription, command processing, response synthesis, and audio playback.
   * @param {AudioFormat} audio - The audio buffer to process.
   * @returns {Promise<CommandResult | null>} A promise that resolves with the command result or null if no transcription.
   */
  processAudio(audio: AudioFormat): Promise<CommandResult | null>;

  /**
   * @function processCommand
   * @description Processes the transcribed text using Gemini 2.5 Flash for intent classification and context analysis.
   * @param {string} text - The transcribed text command.
   * @param {ConversationContext} context - The current conversation context.
   * @returns {Promise<CommandResult>} A promise that resolves with the classified command result.
   */
  processCommand(text: string, context: ConversationContext): Promise<CommandResult>;

  /**
   * @function executeCommand
   * @description Executes the classified command by routing it to the appropriate Mac automation service.
   * @param {CommandResult} command - The command to execute.
   * @returns {Promise<ExecutionResult>} A promise that resolves with the execution result.
   */
  executeCommand(command: CommandResult): Promise<ExecutionResult>;

  /**
   * @function synthesize
   * @description Synthesizes a natural language response using ElevenLabs, with free-tier monitoring.
   * @param {string} text - The text to synthesize into speech.
   * @returns {Promise<AudioFormat>} A promise that resolves with the synthesized audio buffer.
   */
  synthesize(text: string): Promise<AudioFormat>;

  /**
   * @function playAudio
   * @description Plays the given audio buffer through native macOS audio output.
   * @param {AudioFormat} audio - The audio buffer to play.
   * @returns {Promise<void>} A promise that resolves when audio playback is complete.
   */
  playAudio(audio: AudioFormat): Promise<void>;
  release(): void; // The 'isProcessing' property was already absent from this interface.
}

import { AudioFormat, CommandResult, ConversationContext, ExecutionResult, TranscriptionResult, IntentClassificationResult } from '@samantha-ai-assistant/types';
import { AIProcessingEngine } from '@samantha-ai-assistant/ai-engine';
import * as crypto from 'node:crypto';
import { EventEmitter } from 'events';
import { AudioManager } from './audio/AudioManager.js';
import { TranscriptionService } from './transcription/TranscriptionService.js';
import { ResponseSynthesisService } from './synthesis/ResponseSynthesisService.js';
import { AudioPlaybackService } from './playback/AudioPlaybackService.js';





export class VoiceCore extends EventEmitter implements VoiceProcessingPipeline {
  private audioManager: AudioManager;
  private transcriptionService: TranscriptionService;
  private responseSynthesisService: ResponseSynthesisService;
  private audioPlaybackService: AudioPlaybackService;
  private aiEngine: AIProcessingEngine;

  constructor() {
    super();
    this.audioManager = new AudioManager();
    this.transcriptionService = new TranscriptionService();
    this.responseSynthesisService = new ResponseSynthesisService({
      apiKey: process.env.ELEVENLABS_API_KEY || 'YOUR_ELEVENLABS_API_KEY_HERE', // [IMPORTANT] Replace with your actual ElevenLabs API key
    });
    this.audioPlaybackService = new AudioPlaybackService(); // Instantiate internally
    this.aiEngine = new AIProcessingEngine();
    console.log("VoiceCore initialized.");
  }

  public async startRecording(): Promise<void> {
    return this.audioManager.startRecording();
  }

  public async stopRecording(): Promise<AudioFormat> {
    return this.audioManager.stopRecording();
  }

  public async processAudio(audio: AudioFormat): Promise<CommandResult | null> {
    console.log('Processing audio with duration:', audio.duration);
    
    try {
      // Step 1: Transcribe audio using Whisper
      const transcription = await this.transcriptionService.transcribeAudio(audio);
      console.log('Transcription confidence:', transcription.confidence);

      if (!transcription?.text?.trim()) {
        console.log('No valid transcription received');
        return null;
      }

      // Step 3: Process command with conversation context
      const context: ConversationContext = {
        sessionId: crypto.randomUUID(),
        userId: 'current-user',
        history: [],
        userPreferences: {},
      };
      
      const intentClassificationResult: IntentClassificationResult = await this.aiEngine.classifyIntent(transcription.text, context);
      console.log('Intent classified:', intentClassificationResult.intent);

      const commandResult: CommandResult = await this.aiEngine.routeCommand(intentClassificationResult);
      console.log('Command routed:', commandResult.intent);

      // Step 4: Synthesize response with ElevenLabs
      const synthesizedAudio = await this.responseSynthesisService.synthesize(
        commandResult.responseText || `Processed: ${transcription.text}`
      );

      // Step 5: Playback with Core Audio
      if (synthesizedAudio) {
        await this.audioPlaybackService.playAudio(synthesizedAudio);
      }

      return commandResult;
    } catch (error) {
      console.error('Pipeline error:', error);
      this.emit('error', error);
      return null;
    }
  }

  public async processCommand(text: string, context: ConversationContext): Promise<CommandResult> {
    // This method is now handled by the AIProcessingEngine directly within processAudio
    throw new Error('processCommand should not be called directly. Use processAudio.');
  }

  public async executeCommand(command: CommandResult): Promise<ExecutionResult> {
    console.log('Executing command:', command);
    // [PURPOSE] Integrate with @samantha-ai-assistant/mac-automation here for command execution.
    // This will be handled by the AI engine's command routing.
    return this.aiEngine.executeCommand(command);
  }

  public async synthesize(text: string): Promise<AudioFormat> {
    return this.responseSynthesisService.synthesize(text);
  }

  public async playAudio(audio: AudioFormat): Promise<void> {
    return this.audioPlaybackService.playAudio(audio);
  }

  // Add a method to release AudioManager resources when VoiceCore is no longer needed
  public release(): void {
    this.audioManager.shutdown();
    this.audioPlaybackService.shutdown();
  }
}