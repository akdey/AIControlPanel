import time
import json
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger("control_plane.audit")

class RequestResponseLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP API requests and responses, including request body inputs,
    response body outputs, status codes, and execution duration to control_plane.log.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()

        # Capture request info
        path = request.url.path
        method = request.method
        client_ip = request.client.host if request.client else "unknown"

        # Skip logging health check endpoints to keep logs clean
        if path in ["/health", "/"]:
            return await call_next(request)

        # Read Request Body for JSON payloads
        request_body_str = ""
        try:
            body_bytes = await request.body()
            if body_bytes:
                try:
                    body_json = json.loads(body_bytes)
                    request_body_str = json.dumps(body_json, separators=(',', ':'))
                except Exception:
                    request_body_str = body_bytes.decode('utf-8', errors='ignore')[:500]

            # Re-insert body stream so endpoint handlers can read it
            async def receive_body():
                return {"type": "http.request", "body": body_bytes}
            request._receive = receive_body

        except Exception as e:
            request_body_str = f"<Unable to read body: {str(e)}>"

        logger.info(f"--> [API REQ] {method} {path} | Client: {client_ip} | Payload: {request_body_str or '{}'}")

        # Process Request
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(f"<-- [API ERR] {method} {path} | Status: 500 Internal Error | Duration: {duration_ms}ms | Error: {str(exc)}")
            raise exc

        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Intercept Response Body
        response_body_str = ""
        response_body_bytes = b""
        async for chunk in response.body_iterator:
            response_body_bytes += chunk

        try:
            res_json = json.loads(response_body_bytes)
            response_body_str = json.dumps(res_json, separators=(',', ':'))
        except Exception:
            response_body_str = response_body_bytes.decode('utf-8', errors='ignore')[:500]

        logger.info(
            f"<-- [API RES] {method} {path} | Status: {response.status_code} | Duration: {duration_ms}ms | Output: {response_body_str}"
        )

        # Return reconstructed Response
        return Response(
            content=response_body_bytes,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )
