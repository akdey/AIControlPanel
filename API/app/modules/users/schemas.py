from typing import Optional
from pydantic import BaseModel, ConfigDict

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "secops_admin"
    is_2fa_req: Optional[bool] = False

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
    status: str = "authenticated"
    user: UserResponse
    token: Optional[str] = None
