// [CONTEXT] Handles text-to-speech synthesis using ElevenLabs.
import { AudioFormat } from '@samantha-ai-assistant/types';
import { Decoder } from 'node-lame';

interface ResponseSynthesisOptions {
  apiKey?: string;
  voiceId?: string;
  characterLimit?: number;
}

export class ResponseSynthesisService {
  private apiKey: string;
  private voiceId: string;
  private characterLimit: number;
  private charactersUsedThisMonth: number = 0;
  private cache: Map<string, AudioFormat> = new Map(); // Simple in-memory cache

  constructor(options: ResponseSynthesisOptions = {}) {
    // [PURPOSE] Initialize with ElevenLabs API key and optional settings.
    if (!options.apiKey) {
      throw new Error('ElevenLabs API key is required for ResponseSynthesisService.');
    }
    this.apiKey = options.apiKey;
    this.voiceId = options.voiceId || '21m00TNDk4cS6Z8h5nfN'; // Default ElevenLabs voice
    this.characterLimit = options.characterLimit || 10000; // Default free-tier limit

    // [CONTEXT] Load charactersUsedThisMonth from persistent storage if available.
    // For now, it resets on service instantiation.
  }

  // [PURPOSE] Synthesizes text into speech using ElevenLabs.
  async synthesize(text: string): Promise<AudioFormat> {
    // [CONTEXT] Check cache first.
    if (this.cache.has(text)) {
      console.log('Returning synthesized audio from cache.');
      return this.cache.get(text)!;
    }

    // [CONTEXT] Track character usage.
    this.charactersUsedThisMonth += text.length;
    if (this.charactersUsedThisMonth > this.characterLimit) {
      console.warn('ElevenLabs character limit exceeded. Synthesis may fail.');
      // [PURPOSE] Implement more robust error handling or fallback here.
    }

    console.log(`Synthesizing text: "${text}" with ElevenLabs...`);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorBody}`);
      }

      const audioBlob = await response.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const mp3Buffer = Buffer.from(arrayBuffer);

      // Decode MP3 to PCM using node-lame
      const decoder = new Decoder({
        buffer: mp3Buffer,
        // You might need to specify output format options if node-lame doesn't default to PCM
      });

      const pcmBuffer = await new Promise<Buffer>((resolve, reject) => {
        decoder.decode((error, pcm) => {
          if (error) {
            return reject(error);
          }
          resolve(pcm);
        });
      });

      // Convert PCM Buffer to Int16Array
      const pcmInt16Array = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2);

      // ElevenLabs typically returns 44.1kHz sample rate for MP3
      const sampleRate = 44100;
      const channels = 1; // Assuming mono for simplicity, check ElevenLabs docs for stereo
      const duration = pcmInt16Array.length / (sampleRate * channels); // Duration in seconds

      const result: AudioFormat = {
        data: pcmInt16Array,
        sampleRate: sampleRate,
        channels: channels,
        mimeType: 'audio/pcm',
        duration: duration,
      };

      // [CONTEXT] Cache the result.
      this.cache.set(text, result);

      return result;
    } catch (error) {
      console.error('Error during ElevenLabs synthesis:', error);
      throw error;
    }

  // [PURPOSE] Get current character usage.
  getCharactersUsed(): number {
    return this.charactersUsedThisMonth;
  }

  // [PURPOSE] Reset monthly character usage (e.g., at the start of a new month).
  resetMonthlyUsage(): void {
    this.charactersUsedThisMonth = 0;
    // [CONTEXT] Persist this reset if usage is stored externally.
  }

  // [PURPOSE] Clear the synthesis cache.
  clearCache(): void {
    this.cache.clear();
    console.log('Synthesis cache cleared.');
  }
}
}