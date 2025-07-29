# Voice Processing Module

This module provides functionalities for voice input transcription and converting text (LLM responses) into speech, designed to be integrated into the Samantha AI Assistant backend.

## Features

- **Voice Transcription:** Transcribes audio input into text using either an offline Whisper model or a HuggingFace Transformers-based Whisper model.
- **Text-to-Speech (TTS):** Converts text into natural-sounding speech using the ElevenLabs API.

## Components

- `transcription_service.py`: Handles the transcription of audio to text.
- `text_to_speech_service.py`: Manages the conversion of text to speech.

## Usage

Both `transcription_service.py` and `text_to_speech_service.py` are designed to be run as standalone scripts that accept JSON input via `stdin` and return JSON output via `stdout`. This allows for easy integration with the main Samantha backend or other services.

### Transcription Service

To transcribe an audio file:

```bash
echo '{"action": "transcribe", "params": {"audio_file_path": "/path/to/your/audio.wav", "model_type": "offline"}}' | python transcription_service.py
```

- `action`: `"transcribe"`
- `params`:
    - `audio_file_path`: (Required) The absolute path to the audio file to be transcribed.
    - `model_type`: (Optional, default: `"offline"`) Specifies the Whisper model to use. Can be `"offline"` or `"huggingface"`.

### Text-to-Speech Service

To convert text to speech:

```bash
echo '{"action": "convert_text", "params": {"text": "Hello, how can I help you?", "output_file_path": "/path/to/save/audio.mp3", "voice_id": "default"}}' | python text_to_speech_service.py
```

- `action`: `"convert_text"`
- `params`:
    - `text`: (Required) The text string to be converted into speech.
    - `output_file_path`: (Optional, default: `"output.mp3"`) The absolute path where the generated audio file will be saved.
    - `voice_id`: (Optional, default: `"default"`) The ID of the voice to use for synthesis (ElevenLabs specific).
    - `api_key`: (Optional) Your ElevenLabs API key. If not provided, it will attempt to read from the `ELEVENLABS_API_KEY` environment variable. If neither is provided, the service will simulate the conversion.

## Dependencies

Install the necessary Python packages using `pip`:

```bash
pip install -r requirements.txt
```

Refer to `requirements.txt` for specific dependencies based on your chosen Whisper and ElevenLabs integration methods.

## Integration with Web UI

For routing via a microphone button on the web UI, the frontend would need to:

1. Capture audio input from the microphone.
2. Send the captured audio data to the backend (e.g., via WebSocket or HTTP POST) for transcription.
3. Receive the transcribed text from the backend.
4. Send LLM responses (text) to the backend for speech synthesis.
5. Receive the synthesized audio from the backend and play it back to the user.

The `transcription_service.py` and `text_to_speech_service.py` scripts provide the core backend logic for these operations, expecting audio file paths for input and producing audio file paths for output (or directly streaming audio in a more advanced setup).