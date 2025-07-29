# Samantha AI MCP Server

A comprehensive Model Context Protocol (MCP) server that provides voice processing, system automation, and browser integration capabilities for the Samantha AI Assistant.

## 🚀 Features

### Voice Processing
- **Speech Recognition**: Real-time audio transcription using OpenAI Whisper
- **Intent Classification**: Automatic command intent detection and entity extraction
- **Response Synthesis**: Natural language response generation
- **Multi-language Support**: Support for 10+ languages including English, Spanish, French, German, and more

### System Automation
- **File Operations**: Create, delete, move, copy, and search files
- **Application Control**: Launch, close, and focus applications
- **System Control**: Volume, brightness, and system power management
- **Cross-platform Support**: macOS, Windows, and Linux compatibility

### Browser Automation
- **Tab Management**: Open, close, and switch browser tabs
- **Page Interaction**: Click elements, type text, scroll pages
- **Form Automation**: Fill forms and submit data
- **Multi-browser Support**: Chrome, Firefox, and Safari

### Analytics & Monitoring
- **Usage Analytics**: Track command usage and user behavior
- **Performance Monitoring**: Real-time system health monitoring
- **Predictive Analytics**: AI-powered command prediction
- **Business Intelligence**: Revenue tracking and user metrics

## 📋 Requirements

- Python 3.8+
- FastAPI
- aiohttp
- numpy
- platform-specific dependencies

## 🛠️ Installation

1. **Clone the repository**
```bash
cd samantha_ai_assistant/apps/mcp-server
```

2. **Install dependencies**
```bash
pip install -r backend/requirements.txt
```

3. **Set environment variables**
```bash
export OPENAI_API_KEY="your-openai-api-key"
export ELEVENLABS_API_KEY="your-elevenlabs-api-key"  # Optional for TTS
```

4. **Run the server**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

### Voice Processing Endpoints

#### Process Voice Audio
```http
POST /api/v1/voice/process-audio
Content-Type: multipart/form-data

Parameters:
- audio_file: Audio file (WAV, MP3, etc.)
- language: Language code (default: en-US)
- user_id: Optional user identifier
```

**Response:**
```json
{
  "success": true,
  "command": {
    "id": "cmd_20250101_120000_123456",
    "original_text": "Open Safari",
    "intent": "system_control",
    "confidence": 0.95,
    "entities": {
      "app": "safari"
    },
    "timestamp": "2025-01-01T12:00:00",
    "user_id": "user123"
  }
}
```

#### Generate Voice Response
```http
POST /api/v1/voice/generate-response
Content-Type: application/json

{
  "id": "cmd_20250101_120000_123456",
  "original_text": "Open Safari",
  "intent": "system_control",
  "confidence": 0.95,
  "entities": {"app": "safari"},
  "timestamp": "2025-01-01T12:00:00"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "text": "I'll open Safari for you.",
    "audio_format": "wav",
    "duration": 2.5,
    "has_audio": false
  }
}
```

#### Get Supported Languages
```http
GET /api/v1/voice/supported-languages
```

**Response:**
```json
{
  "success": true,
  "languages": {
    "en-US": "English (US)",
    "en-GB": "English (UK)",
    "es-ES": "Spanish",
    "fr-FR": "French",
    "de-DE": "German"
  }
}
```

### System Automation Endpoints

#### Execute Automation Command
```http
POST /api/v1/automation/execute
Content-Type: application/json

{
  "command": "app_launch",
  "params": {
    "app_name": "safari"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application launched: safari",
  "data": {"app": "safari"},
  "error": null,
  "execution_time": 0.15
}
```

#### Get Supported Operations
```http
GET /api/v1/automation/supported-operations
```

**Response:**
```json
{
  "success": true,
  "operations": {
    "file_operations": [
      "create_file", "delete_file", "move_file", "copy_file",
      "create_folder", "delete_folder", "list_files", "search_files"
    ],
    "application_control": [
      "launch_app", "close_app", "focus_app", "list_running_apps"
    ],
    "system_control": [
      "volume_up", "volume_down", "mute", "unmute",
      "brightness_up", "brightness_down"
    ],
    "browser_automation": [
      "open_url", "new_tab", "close_tab", "switch_tab",
      "click_element", "type_text", "scroll_page", "fill_form"
    ]
  }
}
```

### Integrated Voice + Automation

#### Process and Execute Voice Command
```http
POST /api/v1/voice-automation/process-and-execute
Content-Type: multipart/form-data

Parameters:
- audio_file: Audio file
- language: Language code (default: en-US)
- auto_execute: Whether to automatically execute commands (default: false)
- user_id: Optional user identifier
```

**Response:**
```json
{
  "success": true,
  "voice_command": {
    "id": "cmd_20250101_120000_123456",
    "original_text": "Open Safari",
    "intent": "system_control",
    "confidence": 0.95,
    "entities": {"app": "safari"}
  },
  "response": {
    "text": "I'll open Safari for you.",
    "duration": 2.5
  },
  "automation": {
    "success": true,
    "message": "Application launched: safari",
    "data": {"app": "safari"},
    "execution_time": 0.15
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for speech recognition | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for text-to-speech | No |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | No |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins | No |

### Supported Languages

- **English (US)**: `en-US`
- **English (UK)**: `en-GB`
- **Spanish**: `es-ES`
- **French**: `fr-FR`
- **German**: `de-DE`
- **Italian**: `it-IT`
- **Portuguese (Brazil)**: `pt-BR`
- **Japanese**: `ja-JP`
- **Korean**: `ko-KR`
- **Chinese (Simplified)**: `zh-CN`

### Command Patterns

The server recognizes the following command patterns:

#### Browser Navigation
- "open [website]"
- "go to [website]"
- "navigate to [website]"
- "visit [website]"
- "search for [query]"
- "new tab"
- "close tab"
- "switch tab"

#### System Control
- "open [app]"
- "launch [app]"
- "start [app]"
- "quit [app]"
- "close [app]"
- "volume up/down"
- "mute/unmute"

#### File Operations
- "create file [name]"
- "save [file]"
- "delete [file]"
- "move [file] to [location]"
- "copy [file] to [location]"
- "find file [name]"
- "open file [name]"
- "create folder [name]"

#### Web Automation
- "click [element]"
- "type [text] in [field]"
- "scroll [direction]"
- "fill form"
- "submit form"
- "select [option]"
- "check/uncheck [checkbox]"
- "hover over [element]"

#### Information Queries
- "what is [topic]"
- "how to [action]"
- "tell me about [topic]"
- "search for [query]"
- "find information about [topic]"
- "look up [query]"

## 🧪 Testing

### Run Tests
```bash
cd backend
python -m pytest test_api.py -v
```

### Test Voice Processing
```bash
# Test with sample audio file
curl -X POST "http://localhost:8000/api/v1/voice/process-audio" \
  -F "audio_file=@sample_audio.wav" \
  -F "language=en-US"
```

### Test System Automation
```bash
# Test launching an application
curl -X POST "http://localhost:8000/api/v1/automation/execute" \
  -H "Content-Type: application/json" \
  -d '{"command": "app_launch", "params": {"app_name": "safari"}}'
```

## 📊 Monitoring

### Health Check
```http
GET /api/v1/monitoring/health
```

### Metrics
```http
GET /api/v1/monitoring/metrics
```

### Voice Processor Health
```http
GET /api/v1/voice/health
```

### Automation Health
```http
GET /api/v1/automation/health
```

## 🔒 Security

### Authentication
The server supports JWT-based authentication:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}
```

### Secure Endpoints
Protected endpoints require authentication:

```http
GET /api/v1/secure-data
Authorization: Bearer <jwt_token>
```

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Railway Deployment
The project includes `railway.json` for easy deployment to Railway.

### Environment Setup
```bash
# Production environment
export ENVIRONMENT=production
export OPENAI_API_KEY=your-production-key
export CORS_ORIGINS=https://your-domain.com
```

## 📈 Performance

### Optimization Tips
1. **Audio Processing**: Use compressed audio formats (MP3, OGG) for faster uploads
2. **Caching**: Implement Redis caching for frequently used commands
3. **Load Balancing**: Use multiple server instances for high traffic
4. **CDN**: Serve static assets through a CDN

### Benchmarks
- **Voice Processing**: ~2-3 seconds per command
- **System Automation**: ~0.1-0.5 seconds per operation
- **API Response Time**: <100ms for simple operations
- **Concurrent Users**: 100+ simultaneous users supported

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API examples

---

**Samantha AI MCP Server** - Powering the future of voice-controlled automation
