import os
import hashlib
from typing import List, Optional
from core.database import SessionLocal
from core.config_loader import config_data
from core.exceptions import (
    AccountLockedException,
    ResourceNotFoundException,
    UnauthorizedOperationException,
    BaseAppException
)
from modules.users.models import User
from modules.users.schemas import UserCreate, UserResponse, AuthenticatePayload, AuthResponse
from utils.datetime_utils import get_datetime

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes password using PBKDF2-HMAC-SHA256."""
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return hashed, salt

def verify_password(password: str, hashed_password: str, salt: str) -> bool:
    """Verifies input password against stored hash and salt."""
    computed_hash, _ = hash_password(password, salt)
    return computed_hash == hashed_password

class UserService:
    """
    Service Layer for User Management & Authentication.
    Manages DB session creation and cleanup internally per method execution.
    """

    def get_users(self) -> List[UserResponse]:
        """Fetch all registered users."""
        db = SessionLocal()
        try:
            users = db.query(User).all()
            return [self._to_user_response(u) for u in users]
        finally:
            db.close()

    def get_user_by_id(self, user_id: str) -> User:
        """Fetch single user by ID or raise ResourceNotFoundException."""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ResourceNotFoundException(f"User with ID '{user_id}' not found.")
            return user
        finally:
            db.close()

    def create_user(self, payload: UserCreate, created_by: str = "system") -> UserResponse:
        """
        Creates a new user account with system default password from config_data['DEFAULT_PASSWORD'].
        Defaults on creation: privacy_accepted='N', is_2fa_req=True ('Y'), is_pwd_change_req=True ('Y').
        """
        db = SessionLocal()
        try:
            existing = db.query(User).filter(User.username == payload.username).first()
            if existing:
                raise BaseAppException(f"Username '{payload.username}' already exists.", status_code=400, error_code="USERNAME_TAKEN")

            default_pwd = config_data["DEFAULT_PASSWORD"]
            hashed_pwd, salt = hash_password(default_pwd)

            db_user = User(
                username=payload.username,
                password=hashed_pwd,
                role=payload.role,  
                is_2fa_req=True,     
                is_pwd_change_req=True,  
                secret=salt,
                privacy_accepted="N",   
                created_by=created_by,
                created_on=get_datetime()
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return self._to_user_response(db_user)
        finally:
            db.close()

    def authenticate_user(self, payload: AuthenticatePayload) -> AuthResponse:
        """
        Authenticates user login credentials (username + password).
        Enforces MAX_FAILED_LOGIN_ATTEMPTS from config_data.
        Returns 2fa_required if user requires 2FA authentication.
        """
        max_attempts = config_data["MAX_FAILED_LOGIN_ATTEMPTS"]
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == payload.username).first()
            if not user:
                raise UnauthorizedOperationException("Invalid username or password.")

            if not user.is_active:
                raise UnauthorizedOperationException("User account is inactive.")

            if user.is_locked:
                raise AccountLockedException("User account is locked due to multiple failed login attempts. Contact an administrator to unlock.")

            is_valid = verify_password(payload.password, user.password, user.secret or "")
            if not is_valid:
                user.failed_attempts += 1
                if user.failed_attempts >= max_attempts:
                    user.is_locked = True
                    db.commit()
                    raise AccountLockedException(f"User account locked after {max_attempts} consecutive failed login attempts.")
                db.commit()
                remaining = max_attempts - user.failed_attempts
                raise UnauthorizedOperationException(f"Invalid username or password. ({remaining} attempts remaining)")

            # Password is correct — reset failed attempts
            user.failed_attempts = 0

            from utils.jwt_utils import create_jwt_token
            jwt_token = create_jwt_token({
                "sub": user.username,
                "username": user.username,
                "role": user.role,
                "user_id": user.id,
                "is_pwd_change_req": user.is_pwd_change_req
            })

            # Check Two-Factor Authentication (2FA) requirement
            if user.is_2fa_req or user.is_2fa_enabled:
                db.commit()
                return AuthResponse(
                    status="2fa_required",
                    user=self._to_user_response(user),
                    token=jwt_token,
                    message="Two-Factor Authentication (2FA) required to complete login."
                )

            # Update last login timestamp
            user.last_login_at = get_datetime()
            db.commit()
            db.refresh(user)

            # Check if password change required
            if user.is_pwd_change_req:
                return AuthResponse(
                    status="pwd_change_required",
                    user=self._to_user_response(user),
                    token=jwt_token,
                    message="Default password in use. Password change required."
                )

            return AuthResponse(
                status="authenticated",
                user=self._to_user_response(user),
                token=jwt_token
            )
        finally:
            db.close()

    def unlock_user(self, user_id: str) -> UserResponse:
        """Unlocks a locked user account and resets failed attempt counter."""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ResourceNotFoundException(f"User with ID '{user_id}' not found.")
            user.is_locked = False
            user.failed_attempts = 0
            db.commit()
            db.refresh(user)
            return self._to_user_response(user)
        finally:
            db.close()

    def activate_user(self, user_id: str) -> UserResponse:
        """Activates a user account."""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ResourceNotFoundException(f"User with ID '{user_id}' not found.")
            user.is_active = True
            db.commit()
            db.refresh(user)
            return self._to_user_response(user)
        finally:
            db.close()

    def deactivate_user(self, user_id: str) -> UserResponse:
        """Deactivates a user account."""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ResourceNotFoundException(f"User with ID '{user_id}' not found.")
            user.is_active = False
            db.commit()
            db.refresh(user)
            return self._to_user_response(user)
        finally:
            db.close()

    def _to_user_response(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_2fa_req=user.is_2fa_req,
            is_2fa_enabled=user.is_2fa_enabled,
            is_pwd_change_req=user.is_pwd_change_req,
            privacy_accepted=user.privacy_accepted or "N",
            is_locked=user.is_locked,
            failed_attempts=user.failed_attempts,
            is_active=user.is_active,
            created_by=user.created_by or "system",
            created_on=user.created_on.isoformat() if user.created_on else get_datetime().isoformat(),
            last_login_at=user.last_login_at.isoformat() if user.last_login_at else None
        )
