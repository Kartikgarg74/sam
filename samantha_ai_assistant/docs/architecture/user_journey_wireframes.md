# User Journey Wireframes for Samantha AI Assistant

This document outlines the core user interaction flows for Samantha AI Assistant, from voice command initiation to system execution. These wireframes describe the sequence of events and user feedback, aiming for a sub-2 second response time.

## Core Interaction: Voice Command to System Execution

### Scenario 1: Open an Application

**User Goal**: Open a specific application (e.g., "Open Safari")

1.  **User Action**: User speaks the wake word (e.g., "Samantha") followed by the command: "Samantha, open Safari."
    *   **Visual/Audio Feedback**: A subtle visual indicator (e.g., a small, non-intrusive icon on the menu bar or a glow around the microphone icon) appears, and a short, non-disruptive audio cue (e.g., a soft chime) confirms Samantha is listening.

2.  **Samantha Processing (Local STT)**: Local Whisper Tiny model processes the audio input to convert speech to text.
    *   **System State**: Audio stream is captured and processed locally.

3.  **Samantha Processing (AI Engine)**: The transcribed text ("open Safari") is sent to the Gemini 2.5 Flash API for natural language understanding and command interpretation.
    *   **System State**: Text command is sent to `ai-engine` for processing.

4.  **Samantha Action (Mac Automation)**: The `ai-engine` identifies the intent (open application) and the target (Safari). It then calls the `mac-automation` package to execute the command (e.g., `open -a Safari`).
    *   **System State**: macOS automation API is invoked.

5.  **System Response**: Safari application launches.
    *   **Visual/Audio Feedback**: Safari icon bounces in the dock, and the application window appears. Samantha provides a brief audio confirmation: "Opening Safari."

6.  **Completion**: The task is completed.

### Scenario 2: Get Weather Information

**User Goal**: Ask for the current weather (e.g., "What's the weather like today?")

1.  **User Action**: User speaks the wake word and command: "Samantha, what's the weather like today?"
    *   **Visual/Audio Feedback**: Visual indicator and audio cue confirm listening.

2.  **Samantha Processing (Local STT)**: Local Whisper Tiny processes audio.
    *   **System State**: Audio stream captured and processed locally.

3.  **Samantha Processing (AI Engine)**: Transcribed text ("what's the weather like today?") sent to Gemini 2.5 Flash API.
    *   **System State**: Text command sent to `ai-engine` for processing.

4.  **Samantha Action (External API Call)**: The `ai-engine` identifies the intent (weather query). It makes an API call to a weather service (e.g., OpenWeatherMap, not specified in stack but assumed for this example) to fetch the current weather data.
    *   **System State**: External API call initiated and data retrieved.

5.  **Samantha Response (TTS)**: The `ai-engine` formulates a natural language response based on the weather data. This text is then sent to ElevenLabs for text-to-speech conversion.
    *   **System State**: Text response generated, ElevenLabs API invoked.

6.  **Samantha Output**: ElevenLabs returns the audio, which Samantha plays back to the user.
    *   **Visual/Audio Feedback**: Samantha speaks: "The weather today is clear with a temperature of 20 degrees Celsius."

7.  **Completion**: The task is completed.

### Scenario 3: Set a Reminder

**User Goal**: Set a reminder (e.g., "Remind me to call John at 3 PM")

1.  **User Action**: User speaks the wake word and command: "Samantha, remind me to call John at 3 PM."
    *   **Visual/Audio Feedback**: Visual indicator and audio cue confirm listening.

2.  **Samantha Processing (Local STT)**: Local Whisper Tiny processes audio.
    *   **System State**: Audio stream captured and processed locally.

3.  **Samantha Processing (AI Engine)**: Transcribed text ("remind me to call John at 3 PM") sent to Gemini 2.5 Flash API.
    *   **System State**: Text command sent to `ai-engine` for processing.

4.  **Samantha Action (Mac Automation/Calendar Integration)**: The `ai-engine` identifies the intent (set reminder) and extracts details (call John, 3 PM). It then uses `mac-automation` to interact with the macOS Reminders or Calendar application to create the reminder.
    *   **System State**: macOS Reminders/Calendar API invoked.

5.  **Samantha Response (TTS)**: The `ai-engine` formulates a confirmation response. This text is sent to ElevenLabs for TTS conversion.
    *   **System State**: Text response generated, ElevenLabs API invoked.

6.  **Samantha Output**: ElevenLabs returns the audio, which Samantha plays back to the user.
    *   **Visual/Audio Feedback**: Samantha speaks: "Okay, I've set a reminder to call John for 3 PM today."

7.  **Completion**: The task is completed.

## General Interaction Principles

-   **Low Latency**: All steps are optimized for speed to achieve sub-2 second response times.
-   **Minimal Visual Intrusion**: Feedback is subtle and non-disruptive.
-   **Clear Audio Cues**: Short, distinct sounds indicate listening and completion.
-   **Contextual Understanding**: Gemini 2.5 Flash is crucial for handling variations in commands and maintaining conversational context.
-   **Error Handling**: If a command is not understood or an action fails, Samantha should provide clear, concise feedback (e.g., "I'm sorry, I didn't understand that," or "I couldn't open that application.")

These wireframes provide a blueprint for the core user experience, emphasizing efficiency and responsiveness.