import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, safe_mode: bool = False):
        super().__init__(app)
        self.safe_mode = safe_mode
        self.last_voice_command_time = {}
        self.voice_rate_limit_seconds = 5 # 5 seconds between voice commands

    async def dispatch(self, request: Request, call_next):
        # Log all user actions
        logger.info(f"User action: {request.method} {request.url.path}")

        # Confirmation for risky operations (e.g., file delete, shutdown)
        if request.url.path == "/execute" and request.method == "POST":
            try:
                body = await request.json()
                command = body.get("command", {})
                # Example of a risky command check
                if command.get("action") in ["delete_file", "shutdown_system"]:
                    if not command.get("confirm", False):
                        logger.warning(f"Risky operation '{command.get('action')}' attempted without confirmation.")
                        return JSONResponse({"detail": "Confirmation required for this operation.", "confirm_needed": True}, status_code=400)
                    else:
                        logger.info(f"Risky operation '{command.get('action')}' confirmed by user.")
            except Exception as e:
                logger.error(f"Error parsing request body for /execute: {e}")
                return JSONResponse({"detail": "Invalid request body"}, status_code=400)

        # Rate limit voice commands
        if request.url.path == "/voice" and request.method == "POST":
            client_ip = request.client.host
            current_time = time.time()
            if client_ip in self.last_voice_command_time:
                time_since_last_command = current_time - self.last_voice_command_time[client_ip]
                if time_since_last_command < self.voice_rate_limit_seconds:
                    logger.warning(f"Voice command rate limit exceeded for {client_ip}.")
                    return JSONResponse({"detail": f"Please wait {self.voice_rate_limit_seconds - time_since_last_command:.2f} seconds before another voice command."}, status_code=429)
            self.last_voice_command_time[client_ip] = current_time

        # Safe mode toggle (example: prevent certain commands in safe mode)
        if self.safe_mode and request.url.path == "/execute" and request.method == "POST":
            try:
                body = await request.json()
                command = body.get("command", {})
                if command.get("action") in ["modify_system_settings", "install_software"]:
                    logger.warning(f"Operation '{command.get('action')}' blocked due to safe mode.")
                    return JSONResponse({"detail": "Operation blocked in safe mode."}, status_code=403)
            except Exception as e:
                logger.error(f"Error parsing request body for /execute in safe mode check: {e}")

        response = await call_next(request)
        return response

# You can add a function to toggle safe mode if needed, or manage it via environment variables
def set_safe_mode(mode: bool):
    global _safe_mode_enabled
    _safe_mode_enabled = mode
    logger.info(f"Safe mode set to: {_safe_mode_enabled}")

_safe_mode_enabled = False # Default safe mode state