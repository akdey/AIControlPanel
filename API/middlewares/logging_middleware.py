import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class RequestResponseLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for audit logging of incoming API requests and outgoing responses.
    Captures HTTP Method, Path, Client IP, Duration, Status Code, and Payload.
    Uses unified application logging configured by setup_logging().
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"
        
        # Read request body if available
        req_body = ""
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body_bytes = await request.body()
                req_body = body_bytes.decode("utf-8") if body_bytes else ""
                # Re-populate request body stream for downstream route handlers
                async def receive():
                    return {"type": "http.request", "body": body_bytes}
                request._receive = receive
            except Exception:
                req_body = "[Unreadable Request Body]"

        logger.info(
            f"--> [API REQ] {request.method} {request.url.path} | Client: {client_ip}"
            f"{f' | Payload: {req_body[:300]}' if req_body else ''}"
        )

        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000

            logger.info(
                f"<-- [API RES] {request.method} {request.url.path} | Status: {response.status_code} | Duration: {duration_ms:.2f}ms"
            )
            return response
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"<-- [API ERR] {request.method} {request.url.path} | Error: {str(e)} | Duration: {duration_ms:.2f}ms"
            )
            raise e
