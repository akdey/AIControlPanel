from typing import Optional
from pydantic import BaseModel, ConfigDict

class UserCreate(BaseModel):
    username: str
    role: Optional[str] = None  # Defaults to config_data['ROLES']['ADMIN'] if omitted

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    is_2fa_req: bool
    is_2fa_enabled: bool
    is_pwd_change_req: bool
    privacy_accepted: str
    is_locked: bool
    failed_attempts: int
    is_active: bool
    created_by: str
    created_on: str
    last_login_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AuthenticatePayload(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    status: str  # authenticated, 2fa_required, pwd_change_required
    user: UserResponse
    token: Optional[str] = None
    message: Optional[str] = None
