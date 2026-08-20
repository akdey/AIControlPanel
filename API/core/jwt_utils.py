import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from core.config import settings

SECRET_KEY = getattr(settings, "SECRET_KEY", "super_secret_enterprise_control_plane_key_2026")
ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 480  # 8 hours

def create_jwt_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates signed JWT token with claims: username, role, user_id, is_pwd_change_req, is_2fa_req, exp."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=DEFAULT_EXPIRE_MINUTES)
    
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies JWT token signature and expiration.
    Returns claims payload dict or raises Exception.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
