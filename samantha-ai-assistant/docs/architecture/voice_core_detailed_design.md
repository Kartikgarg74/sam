# Voice Core Engine - Detailed Module Design

## 1. Audio Capture Module

### Purpose
Manages the acquisition of audio data from the user's microphone or other input sources, including pre-processing and VAD.

### Technologies
*   **Core Audio (macOS)**: For low-level audio input and output, providing efficient access to microphone data and hardware acceleration.
*   **Web Audio API (Browser/Electron)**: For cross-platform compatibility in a potential Electron-based desktop application.
*   **`node-vad` or similar (Node.js)**: For Voice Activity Detection (VAD) to intelligently start and stop audio recording.

### Interfaces

```typescript
interface AudioInputOptions {
    sampleRate: number; // e.g., 16000 Hz
    channels: number;   // e.g., 1 (mono)
    bufferSize: number; // e.g., 1024, 4096
    vadEnabled: boolean;
    noiseCancellationEnabled: boolean;
}

interface AudioChunk {
    data: Float32Array; // Raw audio data
    timestamp: number;  // Timestamp of the chunk
    isSpeech: boolean;  // From VAD
}

interface IAudioCaptureModule {
    start(options: AudioInputOptions): Promise<void>;
    stop(): Promise<void>;
    on(event: 'audio_chunk', listener: (chunk: AudioChunk) => void): void;
    on(event: 'speech_start', listener: () => void): void;
    on(event: 'speech_end', listener: () => void): void;
    getDevices(): Promise<AudioDeviceInfo[]>;
    setDevice(deviceId: string): Promise<void>;
}

interface AudioDeviceInfo {
    id: string;
    name: string;
    isDefault: boolean;
}
```

### Responsibilities
*   Initialize and manage audio input streams from the selected device.
*   Apply VAD to identify speech segments and emit `speech_start` and `speech_end` events.
*   Perform basic audio pre-processing (e.g., noise reduction, gain control).
*   Buffer audio data into `AudioChunk` objects and emit `audio_chunk` events.
*   Handle audio device enumeration and selection.

## 2. Transcription Module

### Purpose
Converts raw audio data into text using a local or cloud-based Speech-to-Text (STT) service.

### Technologies
*   **`nodejs-whisper`**: For local, on-device transcription using the Whisper Tiny model, optimized for performance on Apple Silicon.
*   **Web Speech API (Browser/Electron fallback)**: As a potential fallback or alternative for browser-based transcription.
*   **Google Cloud Speech-to-Text / OpenAI Whisper API**: As a high-accuracy, cloud-based fallback or alternative for more complex scenarios.

### Interfaces

```typescript
interface TranscriptionOptions {
    model: 'tiny' | 'base' | 'small' | 'medium' | 'large'; // For local Whisper
    language?: string; // e.g., 'en'
    realtime: boolean; // Whether to provide partial results
}

interface TranscriptionResult {
    text: string;
    isFinal: boolean;
    confidence?: number;
    language?: string;
}

interface ITranscriptionModule {
    start(options: TranscriptionOptions): Promise<void>;
    stop(): Promise<void>;
    processAudio(chunk: AudioChunk): Promise<void>;
    on(event: 'transcription_result', listener: (result: TranscriptionResult) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
}
```

### Responsibilities
*   Load and manage the Whisper model (or connect to a cloud STT service).
*   Receive `AudioChunk` objects from the Audio Capture Module.
*   Perform speech-to-text conversion, emitting `transcription_result` events for partial and final results.
*   Handle model loading, inference, and resource management for local STT.
*   Manage API calls and rate limits for cloud STT services.

## 3. Intent & Command Processing Module

### Purpose
Analyzes transcribed text to understand user intent and identify executable commands, interfacing with the `ai-engine`.

### Technologies
*   **`@samantha-ai-assistant/ai-engine`**: The primary interface for NLU and command execution logic.
*   **Internal Rule-based System**: For simple, predefined commands that don't require complex AI processing.
*   **Regular Expressions**: For basic pattern matching in commands.

### Interfaces

```typescript
interface ProcessedCommand {
    command: string; // e.g., 'playMusic', 'setReminder'
    args: Record<string, any>; // Extracted entities/parameters
    rawText: string; // Original transcribed text
    confidence?: number;
}

interface IIntentCommandProcessingModule {
    processText(text: string, context: ConversationContext): Promise<ProcessedCommand | null>;
    on(event: 'command_identified', listener: (command: ProcessedCommand) => void): void;
    on(event: 'no_command_found', listener: (text: string) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
}
```

### Responsibilities
*   Receive transcribed text from the Transcription Module.
*   Utilize the `ai-engine` to perform NLU, intent recognition, and entity extraction.
*   Construct `ProcessedCommand` objects based on identified intent and extracted arguments.
*   Handle conversational context and state management (via `ConversationContext`).
*   Emit `command_identified` or `no_command_found` events.

## 4. Response Synthesis Module

### Purpose
Converts text-based responses from the AI engine into spoken audio.

### Technologies
*   **ElevenLabs API**: For high-quality, natural-sounding Text-to-Speech (TTS).
*   **Local TTS (e.g., macOS built-in AVSpeechSynthesizer)**: As a potential fallback or for system-level alerts.

### Interfaces

```typescript
interface SynthesisOptions {
    voiceId: string; // ElevenLabs voice ID
    stability?: number; // ElevenLabs parameter
    similarityBoost?: number; // ElevenLabs parameter
    modelId?: string; // ElevenLabs model ID
}

interface SynthesizedAudio {
    audioData: ArrayBuffer; // Raw audio data (e.g., MP3, PCM)
    format: string; // e.g., 'audio/mpeg', 'audio/wav'
    duration: number; // in seconds
}

interface IResponseSynthesisModule {
    synthesize(text: string, options: SynthesisOptions): Promise<SynthesizedAudio>;
    cacheAudio(text: string, audio: SynthesizedAudio): Promise<void>;
    retrieveCachedAudio(text: string): Promise<SynthesizedAudio | null>;
    on(event: 'error', listener: (error: Error) => void): void;
}
```

### Responsibilities
*   Receive text responses from the AI engine.
*   Call the ElevenLabs API (or local TTS) to synthesize audio.
*   Implement a caching mechanism for frequently used phrases to reduce API calls and latency.
*   Manage ElevenLabs API key and usage tracking.
*   Return `SynthesizedAudio` objects.

## 5. Audio Playback Module

### Purpose
Manages the playback of synthesized audio responses to the user.

### Technologies
*   **Core Audio (macOS)**: For low-latency audio output.
*   **Web Audio API (Browser/Electron)**: For cross-platform compatibility.
*   **`node-speaker` or similar (Node.js)**: For direct audio playback in Node.js environments.

### Interfaces

```typescript
interface IAudioPlaybackModule {
    play(audio: SynthesizedAudio): Promise<void>;
    stop(): Promise<void>;
    setVolume(volume: number): void; // 0.0 to 1.0
    on(event: 'playback_start', listener: () => void): void;
    on(event: 'playback_end', listener: () => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
}
```

### Responsibilities
*   Initialize and manage audio output streams.
*   Receive `SynthesizedAudio` objects from the Response Synthesis Module.
*   Queue and play audio buffers.
*   Handle audio output device selection and configuration.
*   Manage audio interruptions and mixing.
*   Emit `playback_start` and `playback_end` events.