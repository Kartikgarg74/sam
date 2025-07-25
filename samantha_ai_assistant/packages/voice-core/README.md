# Voice Core Engine

## Purpose
This module (`packages/voice-core/`) is designed to handle the core voice processing functionalities for the Samantha AI Assistant. It encompasses audio capture, transcription, and synthesis, with a strong focus on optimizing performance for Mac M2 hardware.

## Dependencies
- `@samantha-ai-assistant/types`: For shared type definitions like `AudioBuffer`.
- **Whisper Tiny**: Integrated locally for efficient audio transcription.
- **ElevenLabs API**: Used for high-quality speech synthesis.
- **CoreAudio (macOS Native)**: Leveraged for Mac M2 specific audio processing acceleration.

## Key Components
- **`AudioPipeline`**: Manages microphone input, Voice Activity Detection (VAD), noise cancellation, and efficient audio buffer handling. It optimizes audio quality and format for Mac M2.
- **`TranscriptionService`**: Integrates the Whisper Tiny model for local audio transcription. It includes performance optimizations for Mac M2 and handles batch processing of audio chunks.
- **`ResponseSynthesis`**: Manages speech synthesis using the ElevenLabs API. It includes free-tier usage monitoring, character limit tracking, and a caching system for common phrases to reduce API calls and latency.

## Usage Examples

```typescript
import { AudioPipeline, TranscriptionService, ResponseSynthesis } from '@samantha-ai-assistant/voice-core';

// Initialize components
const audioPipeline = new AudioPipeline();
const transcriptionService = new TranscriptionService();
const responseSynthesis = new ResponseSynthesis('YOUR_ELEVENLABS_API_KEY');

async function processVoiceCommand() {
  try {
    // 1. Capture Audio
    // In a real scenario, captureAudio would return a stream or buffer
    console.log('Capturing audio...');
    const capturedAudio = { /* ... actual audio data ... */ }; // Simulate captured audio
    const processedAudio = audioPipeline.processAudioStream(capturedAudio);
    const optimizedAudio = audioPipeline.optimizeAudioQuality(processedAudio);

    // 2. Transcribe Audio
    console.log('Transcribing audio...');
    const transcribedText = transcriptionService.transcribe(optimizedAudio);
    console.log('Transcribed:', transcribedText);

    // 3. Synthesize Response (example)
    const responseText = `You said: ${transcribedText}. How can I help you further?`;
    console.log('Synthesizing response:', responseText);
    const synthesizedAudio = await responseSynthesis.synthesizeResponse(responseText);
    console.log('Synthesized audio buffer:', synthesizedAudio);

    // 4. Play Audio (conceptual, actual playback handled by another service)
    // playAudio(synthesizedAudio);

  } catch (error) {
    console.error('Error during voice command processing:', error);
    // Handle errors, potentially using fallback mechanisms
    transcriptionService.handleTranscriptionError(error);
  }
}

processVoiceCommand();
```

## API Reference

### `AudioPipeline`
- `constructor()`: Initializes the audio pipeline components.
- `processAudioStream(stream: any)`: Processes an incoming audio stream, applying VAD and noise cancellation.
- `optimizeAudioQuality(audioData: any)`: Optimizes audio sample rate and format.
- `getBufferStatus()`: Returns the current status of audio buffers.

### `TranscriptionService`
- `constructor()`: Initializes the Whisper Tiny model.
- `transcribe(audioBuffer: any)`: Transcribes an audio buffer using the Whisper Tiny model.
- `handleTranscriptionError(error: any)`: Implements fallback mechanisms for transcription failures.

### `ResponseSynthesis`
- `constructor(elevenLabsApiKey: string)`: Initializes ElevenLabs API integration with the provided API key.
- `synthesizeResponse(text: string)`: Synthesizes text into speech using ElevenLabs, with caching and usage tracking.
- `optimizeAudioOutput(audioBuffer: AudioBuffer)`: Optimizes audio quality and compression settings for synthesized speech.
- `getCurrentUsage()`: Retrieves the current monthly character usage for ElevenLabs.
- `getMonthlyLimit()`: Retrieves the monthly character limit for ElevenLabs.
- `getUsageResetDate()`: Retrieves the date when the ElevenLabs usage resets.

## Development Setup
To set up the Voice Core Engine for local development:
1. Ensure you have Node.js and pnpm installed.
2. Navigate to the monorepo root and install dependencies: `pnpm install`.
3. Build the `voice-core` package: `pnpm build --filter=voice-core`.
4. Obtain an API key from ElevenLabs for speech synthesis.
5. Configure environment variables for API keys (e.g., `ELEVENLABS_API_KEY`).

## Testing
(To be implemented) This section will cover how to run tests for the voice core module, including unit tests for individual components and integration tests for the overall pipeline.

## Contributing
(To be implemented) Guidelines for contributing to the Voice Core Engine, including code style, commit message conventions, and pull request process.