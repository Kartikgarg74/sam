from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, \
    BackgroundTasks, Response
from typing import List
from .auth import create_access_token, get_current_user
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


router = APIRouter()

# Start Prometheus metrics server
start_metrics_server(port=8001)


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


# Voice Processing Endpoint
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
