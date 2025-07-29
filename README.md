# Samantha AI Assistant

Samantha is a highly intelligent, helpful, and context-aware OS-level personal assistant designed to enhance real-world productivity and system control. Powered by Gemini 2.5 Flash, Samantha seamlessly integrates with your operating system to translate natural language into actionable commands, manage files, adjust settings, and provide intelligent suggestions.

## ✨ Features

- **Natural Language Command Translation**: Understands and executes system commands from natural language input.
- **OS-Level Operations**: 
  - Launch, close, switch, and focus applications (e.g., VS Code, Chrome).
  - Adjust system settings (volume, brightness, Wi-Fi toggle).
  - Manage local files (create folders, rename, open, delete documents).
  - Execute safe terminal commands upon explicit request.
  - Schedule reminders, timers, and alarms.
- **Intelligent Memory & Learning**: 
  - Utilizes vector or key-value memory to recall past commands, user preferences, and automation patterns.
  - Learns frequent workflows and application usage over time.
  - Provides helpful suggestions based on learned patterns (e.g., suggesting opening Chrome at a specific time).
- **Voice and Interaction Support**: 
  - Accepts voice input and responds with text or text-to-speech.
  - Adapts to both typing and speaking interaction styles.
- **Context-Awareness**: Maintains conversational context across multiple interactions.
- **Safety & Reliability**: 
  - Prioritizes safe execution, requiring user consent for high-impact actions.
  - Implements security middleware for confirmation on risky operations and rate limiting for voice commands.
  - Features a "safe mode" toggle for enhanced control.
  - Logs user actions for transparency and debugging.

## 🚀 Setup Instructions

To get Samantha up and running, follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/samantha-ai-assistant.git
cd samantha-ai-assistant
```

### 2. Environment Variables

Create a `.env` file in the root directory of the project and populate it with the following environment variables. You can use the provided `.env.example` as a template.

```
# --- Backend ---
SECRET_KEY=your-random-secret-key
DATABASE_URL=postgresql://your-neon-db-owner:your-neon-db-password@your-neon-db-host/your-neon-db-name?sslmode=require&channel_binding=require
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
GEMINI_API_KEY=your-gemini-api-key # Or GOOGLE_API_KEY if using Google Cloud
WHISPER_MODEL_PATH=./models/whisper-tiny # Path to your Whisper model
ELEVENLABS_API_KEY=your-elevenlabs-api-key # If using ElevenLabs for TTS
RAILWAY_ENV=production # Set to 'production' for Railway deployment

# --- Frontend ---
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# --- General ---
ENV=development # Set to 'production' for production environment
```

**Important Notes:**

- **Gemini API Key**: Obtain your `GEMINI_API_KEY` from the Google AI Studio or Google Cloud Console.
- **Railway Deployment**: If deploying to Railway, ensure `RAILWAY_ENV` is set to `production` and configure your environment variables within the Railway project settings. You might also need `GOOGLE_API_KEY` and `ELEVENLABS_API_KEY` as seen in `.env.railway`.

### 3. Install Dependencies

Navigate to the `samantha_ai_assistant/apps/samantha-backend` directory and install the Python dependencies:

```bash
cd samantha_ai_assistant/apps/samantha-backend
pip install -r requirements.txt
```

Then, navigate to the `samantha_ai_assistant/apps/samantha-web` directory and install the Node.js dependencies:

```bash
cd ../samantha-web
npm install
```

### 4. Run the Application

#### Backend

From the `samantha_ai_assistant/apps` directory, run the FastAPI backend:

```bash
uvicorn samantha-backend.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend

From the `samantha_ai_assistant/apps/samantha-web` directory, run the Next.js frontend:

```bash
npm run dev
```

Samantha should now be accessible in your browser, typically at `http://localhost:3000` (frontend) and `http://localhost:8000` (backend API).

## 🤝 How to Contribute

We welcome contributions to Samantha! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, report bugs, and suggest new features.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 📺 Demo

[Embed GIF demo here. Instructions for embedding a GIF from a service like Gfycat or Imgur can be added here.]

```html
<!-- Example for embedding a GIF from Gfycat -->
<img src="YOUR_GIF_URL_HERE" alt="Samantha Demo" width="800"/>
```