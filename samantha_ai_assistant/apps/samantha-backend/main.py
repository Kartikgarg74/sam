import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from gemini_service import GeminiService
from security_middleware import SecurityMiddleware, set_safe_mode
from memory_system import MemorySystem

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:5173",  # Allow your frontend to access the backend
    "http://localhost",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Security Middleware
app.add_middleware(SecurityMiddleware, safe_mode=False) # Initialize with safe_mode off

# Initialize GeminiService
gemini_service = GeminiService(api_key=os.getenv("GOOGLE_API_KEY")) # Initialize with API key

# Initialize MemorySystem
memory_system = MemorySystem()

# Placeholder for executor module
# from samantha_ai_assistant.packages.command_intelligence.executor import CommandExecutor
# command_executor = CommandExecutor()

# Placeholder for voice processing (Whisper and ElevenLabs)
from samantha_ai_assistant.packages.voice_processing.transcription_service import TranscriptionService
from samantha_ai_assistant.packages.voice_processing.text_to_speech_service import TextToSpeechService
# transcription_service = TranscriptionService()
text_to_speech_service = TextToSpeechService(api_key=os.getenv("ELEVENLABS_API_KEY"))

class AskRequest(BaseModel):
    user_query: str
    system_prompt: str

class ExecuteRequest(BaseModel):
    command: dict  # Assuming command is a JSON object

class VoiceRequest(BaseModel):
    audio_data: str  # Base64 encoded audio data

class SpeakRequest(BaseModel):
    text: str

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called.")
    return {"status": "ok"}

@app.post("/ask")
async def ask_gemini(request: AskRequest):
    try:
        logger.info(f"Received /ask request: {request.user_query}")
        response = gemini_service.query(request.user_query, request.system_prompt)
        return JSONResponse({"text": response["text"], "commands": response["commands"]})
    except Exception as e:
        logger.error(f"Error in /ask endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute")
async def execute_command(request: ExecuteRequest):
    try:
        logger.info(f"Received /execute request with command: {request.command}")
        # result = command_executor.execute(request.command)
        result = f"Executed command: {request.command}" # Placeholder
        return {"result": result}
    except Exception as e:
        logger.error(f"Error in /execute endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice")
async def process_voice_input(request: VoiceRequest):
    try:
        logger.info("Received /voice request.")
        # text = transcription_service.transcribe_audio(request.audio_data)
        text = "This is a transcribed text from audio." # Placeholder
        return {"transcribed_text": text}
    except Exception as e:
        logger.error(f"Error in /voice endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/speak")
async def convert_text_to_speech(request: SpeakRequest):
    try:
        logger.info(f"Received /speak request with text: {request.text}")
        # audio_output = text_to_speech_service.convert_text_to_speech(request.text)
        audio_output = "base64_encoded_audio_data" # Placeholder
        return {"audio_data": audio_output}
    except Exception as e:
        logger.error(f"Error in /speak endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class SafeModeToggleRequest(BaseModel):
    enable: bool

@app.post("/safe_mode")
async def toggle_safe_mode(request: SafeModeToggleRequest):
    set_safe_mode(request.enable)
    return {"status": "success", "safe_mode_enabled": request.enable}

class AppUsageRequest(BaseModel):
    app_name: str

@app.post("/record_app_usage")
async def record_app_usage(request: AppUsageRequest):
    memory_system.add_app_usage(request.app_name)
    return {"status": "success", "message": f"Recorded usage for {request.app_name}"}

class CommandUsageRequest(BaseModel):
    command: str
    time_of_day: str = None

@app.post("/record_command_usage")
async def record_command_usage(request: CommandUsageRequest):
    memory_system.add_command_usage(request.command, request.time_of_day)
    return {"status": "success", "message": f"Recorded command usage for {request.command}"}

class PhrasingPatternRequest(BaseModel):
    pattern: str

@app.post("/record_phrasing_pattern")
async def record_phrasing_pattern(request: PhrasingPatternRequest):
    memory_system.add_phrasing_pattern(request.pattern)
    return {"status": "success", "message": f"Recorded phrasing pattern: {request.pattern}"}

@app.get("/get_suggestion")
async def get_suggestion():
    suggestion = memory_system.get_suggestion()
    return {"suggestion": suggestion}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)