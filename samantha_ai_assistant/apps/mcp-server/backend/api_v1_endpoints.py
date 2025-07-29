from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, \
    BackgroundTasks, Response, Form
from typing import List, Dict, Any
from .auth import create_access_token, get_current_user
from .voice_processor import voice_processor, VoiceCommand
from .system_automation import system_automation, AutomationResult
from queue import Queue
import asyncio
from samantha_ai_assistant.packages.monitoring.health import (
    get_system_health, check_endpoints
)
from samantha_ai_assistant.packages.monitoring.metrics import (
    start_metrics_server, update_system_metrics
)
from samantha_ai_assistant.packages.monitoring.alerting import send_alert
from samantha_ai_assistant.packages.analytics.user_analytics import (
    log_command, get_usage_stats
)
from samantha_ai_assistant.packages.analytics.reporting import generate_report
from samantha_ai_assistant.packages.analytics.predictive import predictor
from samantha_ai_assistant.packages.analytics.business_intelligence import (
    log_user, log_revenue, get_bi_metrics
)
from datetime import datetime

router = APIRouter()

# Start Prometheus metrics server
start_metrics_server(port=8001)

# ============================================================================
# VOICE PROCESSING ENDPOINTS
# ============================================================================

@router.post('/voice/process-audio')
async def process_voice_audio(
    audio_file: UploadFile = File(...),
    language: str = Form('en-US'),
    user_id: str = Form(None)
):
    """
    Process voice audio and return structured command
    """
    try:
        # Read audio file
        audio_data = await audio_file.read()

        # Process audio through voice processor
        command = await voice_processor.process_audio(audio_data, language)

        # Add user ID if provided
        if user_id:
            command.user_id = user_id

        # Log command for analytics
        log_command(command.original_text)

        return {
            "success": True,
            "command": {
                "id": command.id,
                "original_text": command.original_text,
                "intent": command.intent,
                "confidence": command.confidence,
                "entities": command.entities,
                "timestamp": command.timestamp.isoformat(),
                "user_id": command.user_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

@router.post('/voice/generate-response')
async def generate_voice_response(command_data: Dict[str, Any]):
    """
    Generate voice response for a processed command
    """
    try:
        # Create VoiceCommand object from request data
        command = VoiceCommand(
            id=command_data.get('id'),
            original_text=command_data.get('original_text'),
            intent=command_data.get('intent'),
            confidence=command_data.get('confidence', 0.0),
            entities=command_data.get('entities', {}),
            timestamp=datetime.fromisoformat(command_data.get('timestamp')),
            user_id=command_data.get('user_id')
        )

        # Generate response
        response = await voice_processor.generate_response(command)

        return {
            "success": True,
            "response": {
                "text": response.text,
                "audio_format": response.audio_format,
                "duration": response.duration,
                "has_audio": response.audio_data is not None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response generation failed: {str(e)}")

@router.get('/voice/supported-languages')
async def get_supported_languages():
    """Get list of supported languages for voice processing"""
    return {
        "success": True,
        "languages": voice_processor.get_supported_languages()
    }

@router.get('/voice/command-patterns')
async def get_command_patterns():
    """Get command patterns for intent recognition"""
    return {
        "success": True,
        "patterns": voice_processor.get_command_patterns()
    }

@router.get('/voice/health')
async def voice_health_check():
    """Check voice processor health"""
    health = await voice_processor.health_check()
    return {
        "success": True,
        "health": health
    }

# ============================================================================
# SYSTEM AUTOMATION ENDPOINTS
# ============================================================================

@router.post('/automation/execute')
async def execute_automation_command(
    command: str,
    params: Dict[str, Any] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Execute a system automation command
    """
    try:
        # Execute command
        result = await system_automation.execute_command(command, params or {})

        # Add to background tasks if provided
        if background_tasks:
            background_tasks.add_task(log_automation_result, result)

        return {
            "success": result.success,
            "message": result.message,
            "data": result.data,
            "error": result.error,
            "execution_time": result.execution_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Automation failed: {str(e)}")

@router.get('/automation/supported-operations')
async def get_supported_operations():
    """Get list of supported automation operations"""
    return {
        "success": True,
        "operations": system_automation.get_supported_operations()
    }

@router.get('/automation/health')
async def automation_health_check():
    """Check system automation health"""
    health = await system_automation.health_check()
    return {
        "success": True,
        "health": health
    }

# ============================================================================
# INTEGRATED VOICE + AUTOMATION ENDPOINTS
# ============================================================================

@router.post('/voice-automation/process-and-execute')
async def process_and_execute_voice_command(
    audio_file: UploadFile = File(...),
    language: str = Form('en-US'),
    auto_execute: bool = Form(False),
    user_id: str = Form(None)
):
    """
    Process voice command and optionally execute automation
    """
    try:
        # Step 1: Process voice audio
        audio_data = await audio_file.read()
        logger.info(f"Audio data read from UploadFile. Size: {len(audio_data)} bytes")
        command = await voice_processor.process_audio(audio_data, language)

        if user_id:
            command.user_id = user_id

        # Step 2: Execute automation if auto_execute is true
        # Step 2: Generate response
        response = await voice_processor.generate_response(command)

        # Step 3: Execute automation if requested and confidence is high
        automation_result = None
        if auto_execute and command.confidence > 0.7:
            # Map intent to automation command
            automation_command = map_intent_to_automation(command.intent, command.entities)
            if automation_command:
                automation_result = await system_automation.execute_command(
                    automation_command['command'],
                    automation_command['params']
                )

        return {
            "success": True,
            "voice_command": {
                "id": command.id,
                "original_text": command.original_text,
                "intent": command.intent,
                "confidence": command.confidence,
                "entities": command.entities
            },
            "response": {
                "text": response.text,
                "duration": response.duration
            },
            "automation": automation_result.to_dict() if automation_result else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice automation failed: {str(e)}")

def map_intent_to_automation(intent: str, entities: Dict[str, str]) -> Dict[str, Any]:
    """Map voice intent to automation command"""
    if intent == 'browser_navigation':
        if 'url' in entities:
            return {
                'command': 'browser_open_url',
                'params': {
                    'browser': 'chrome',
                    'url': entities['url'],
                    'new_tab': True
                }
            }
    elif intent == 'system_control':
        if 'app' in entities:
            return {
                'command': 'app_launch',
                'params': {
                    'app_name': entities['app']
                }
            }
    return None

async def log_automation_result(result: AutomationResult):
    """Log automation result for analytics"""
    # TODO: Implement logging
    pass

# ============================================================================
# EXISTING ENDPOINTS (KEPT FOR COMPATIBILITY)
# ============================================================================

# Health check endpoint
@router.get('/monitoring/health')
async def health():
    health = get_system_health()
    update_system_metrics(
        health['cpu_percent'], health['memory_percent'], health['disk_percent']
    )
    return health

# Endpoint status check
@router.post('/monitoring/check-endpoints')
async def check(endpoints: List[str]):
    return check_endpoints(endpoints)

# Prometheus metrics endpoint (proxy)
@router.get('/monitoring/metrics')
async def metrics():
    import requests
    r = requests.get('http://localhost:8001/metrics')
    return Response(content=r.text, media_type='text/plain')

# Alerting endpoint
@router.post('/monitoring/alert')
async def alert(message: str):
    send_alert(message)
    return {"status": "alert sent"}

# User analytics endpoints
@router.post('/analytics/log-command')
async def log_cmd(command: str):
    log_command(command)
    predictor.log_command(command)
    return {"status": "logged"}

@router.get('/analytics/usage-stats')
async def usage_stats():
    return get_usage_stats()

# Predictive analytics endpoints
@router.get('/analytics/predict-next')
async def predict_next():
    return {"predicted": predictor.predict_next_commands()}

@router.get('/analytics/trend')
async def trend():
    return {"trend": predictor.get_trend()}

# Business intelligence endpoints
@router.post('/bi/log-user')
async def bi_log_user(user_id: str):
    log_user(user_id)
    return {"status": "user logged"}

@router.post('/bi/log-revenue')
async def bi_log_revenue(amount: float):
    log_revenue(amount)
    return {"status": "revenue logged"}

@router.get('/bi/metrics')
async def bi_metrics():
    return get_bi_metrics()

# Reporting endpoint
@router.post('/analytics/report')
async def report(data: dict):
    generate_report(data)
    return {"status": "report generated"}

# Voice Processing Endpoint (Legacy)
@router.post('/voice/process')
async def process_voice(file: UploadFile = File(...)):
    # TODO: Integrate with voice processing engine
    return {"status": "success", "transcription": "Hello world"}

# Automation Control Endpoint with queuing
@router.post('/automation/command')
async def automation_command(command: str, background_tasks: BackgroundTasks):
    await Queue.enqueue(command)
    background_tasks.add_task(process_queue)
    return {
                "status": "queued",
                "command": command,
                "queue_length": Queue.qsize()
            }

async def process_queue():
    # Simulate processing the next command in the queue
    if Queue.qsize() > 0:
        cmd = await Queue.dequeue()
        await asyncio.sleep(1)  # Simulate processing time
        print(f"Processed command: {cmd}")

@router.get('/automation/queue-length')
async def get_queue_length():
    return {"queue_length": Queue.qsize()}

# Configuration Management Endpoints
@router.get('/config')
async def get_config():
    # TODO: Fetch config from DB or settings
    return {"voice": {"recognition": "Whisper"}, "user": {"theme": "light"}}

@router.post('/config')
async def update_config(config: dict):
    # TODO: Update config in DB or settings
    return {"status": "updated", "config": config}

# Analytics and Monitoring Endpoint (legacy)
@router.get('/analytics/usage')
async def get_usage():
    # TODO: Return usage analytics
    return {"commands_today": 42, "most_used": "Open Safari"}

# JWT Authentication: Demo login
@router.post('/auth/login')
async def login(username: str, password: str):
    # Demo: Accept any username/password
    if not username or not password:
        raise HTTPException(status_code=400,
            detail="Username and password required")
    access_token = create_access_token({"sub": username})
    return {"access_token": access_token, "token_type": "bearer"}

# Secure endpoint with JWT
@router.get('/secure-data')
async def secure_data(user=Depends(get_current_user)):
    return {"data": "secure info", "user": user}
