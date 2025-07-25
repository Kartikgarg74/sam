from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
import time


RATE_LIMIT = 60  # requests per minute per IP
rate_limit_store = {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = request.client.host
        now = int(time.time())
        window = now // 60
        key = f"{ip}:{window}"
        count = rate_limit_store.get(key, 0)
        if count >= RATE_LIMIT:
            return JSONResponse(
                {"detail": "Rate limit exceeded"},
                status_code=HTTP_429_TOO_MANY_REQUESTS
            )
        rate_limit_store[key] = count + 1
        response = await call_next(request)
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            return JSONResponse({"detail": str(exc)}, status_code=500)
