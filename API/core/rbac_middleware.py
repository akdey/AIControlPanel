import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from core.jwt_utils import decode_jwt_token
from core.rbac_policy import is_route_allowed_for_role

logger = logging.getLogger(__name__)

# List of public endpoints bypassing mandatory authentication checks
PUBLIC_ROUTES = [
    "/",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/v1/auth/authenticate",
    "/api/v1/auth/login"
]

class JWTAuthRBACMiddleware(BaseHTTPMiddleware):
    """
    Central JWT Authentication and Role-Based Access Control (RBAC) Route Authorization Middleware.
    Inspects 'x-access-token' header on all protected requests.
    """
    async def dispatch(self, request: Request, call_next):
        # 1. CORS Preflight Bypass (HTTP OPTIONS 200 OK)
        if request.method.upper() == "OPTIONS":
            return await call_next(request)

        # 2. Public Endpoints Whitelist Bypass
        req_path = request.url.path
        if any(req_path == route or req_path.startswith("/api/v1/auth/") for route in PUBLIC_ROUTES):
            return await call_next(request)

        # 3. Extract JWT Token from 'x-access-token' Header (Case-Insensitive)
        token = request.headers.get("x-access-token") or request.headers.get("X-Access-Token")
        
        # Fallback check for Authorization Bearer header if provided
        if not token:
            auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            logger.warning(f"Unauthenticated access attempt to {request.method} {req_path}: Missing 'x-access-token' header.")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "status": "error",
                    "error_code": "AUTH_HEADER_MISSING",
                    "detail": "Authentication required. Missing 'x-access-token' header in request."
                }
            )

        # 4. Decode & Validate JWT Claims
        try:
            claims = decode_jwt_token(token)
        except Exception as e:
            logger.warning(f"Invalid JWT token presented for {request.method} {req_path}: {e}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "status": "error",
                    "error_code": "INVALID_JWT_TOKEN",
                    "detail": f"Authentication failed: {str(e)}"
                }
            )

        # 5. Attach Claims to Request State
        username = claims.get("username")
        role = claims.get("role")
        request.state.user = claims
        request.state.username = username
        request.state.role = role

        # 6. Validate Account Onboarding State (Password Change or 2FA Lock)
        if claims.get("is_pwd_change_req") and not req_path.endswith("/change-password"):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "status": "error",
                    "error_code": "PASSWORD_CHANGE_REQUIRED",
                    "detail": "Password change required before accessing requested API resources."
                }
            )

        # 7. Validate Role-Based Route Authorization (RBAC)
        if not is_route_allowed_for_role(role, req_path, request.method):
            logger.warning(f"Unauthorized RBAC access attempt by user '{username}' (Role: '{role}') to {request.method} {req_path}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "status": "error",
                    "error_code": "FORBIDDEN_ROLE_ACCESS",
                    "detail": f"Access Denied: Role '{role}' is not authorized to perform {request.method} on {req_path}."
                }
            )

        # Proceed to route execution
        return await call_next(request)
