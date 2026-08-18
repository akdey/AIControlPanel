import os
import hashlib
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.config_loader import config_data
from app.core.exceptions import (
    AccountLockedException,
    ResourceNotFoundException,
    UnauthorizedOperationException,
    BaseAppException
)
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserResponse, AuthenticatePayload, AuthResponse
from app.utils.datetime_utils import get_datetime

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
    Uses central config_data dictionary for runtime settings, roles, and default passwords.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_users(self) -> List[UserResponse]:
        """Fetch all registered users."""
        users = self.db.query(User).all()
        return [self._to_user_response(u) for u in users]

    def get_user_by_id(self, user_id: str) -> User:
        """Fetch single user by ID or raise ResourceNotFoundException."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ResourceNotFoundException(f"User with ID '{user_id}' not found.")
        return user

    def create_user(self, payload: UserCreate, created_by: str = "system") -> UserResponse:
        """
        Creates a new user account with system default password from config_data['DEFAULT_PASSWORD'].
        Sets is_2fa_req = True by default and is_pwd_change_req = True.
        """
        existing = self.db.query(User).filter(User.username == payload.username).first()
        if existing:
            raise BaseAppException(f"Username '{payload.username}' already exists.", status_code=400, error_code="USERNAME_TAKEN")

        default_pwd = config_data["DEFAULT_PASSWORD"]
        user_role = payload.role or config_data["ROLES"]["ADMIN"]
        hashed_pwd, salt = hash_password(default_pwd)

        db_user = User(
            username=payload.username,
            password=hashed_pwd,
            role=user_role,
            is_2fa_req=config_data.get("DEFAULT_2FA_REQUIRED", True),  # Default True / "Y"
            is_pwd_change_req=True,  # Forces password change on first login
            secret=salt,
            privacy_accepted=config_data.get("DEFAULT_PRIVACY_ACCEPTED", "Y"),
            created_by=created_by,
            created_on=get_datetime()
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return self._to_user_response(db_user)

    def authenticate_user(self, payload: AuthenticatePayload) -> AuthResponse:
        """
        Authenticates user login credentials (username + password).
        Enforces MAX_FAILED_LOGIN_ATTEMPTS from config_data.
        Returns 2fa_required if user requires 2FA authentication.
        """
        max_attempts = config_data["MAX_FAILED_LOGIN_ATTEMPTS"]

        user = self.db.query(User).filter(User.username == payload.username).first()
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
                self.db.commit()
                raise AccountLockedException(f"User account locked after {max_attempts} consecutive failed login attempts.")
            self.db.commit()
            remaining = max_attempts - user.failed_attempts
            raise UnauthorizedOperationException(f"Invalid username or password. ({remaining} attempts remaining)")

        # Password is correct — reset failed attempts
        user.failed_attempts = 0

        # Check Two-Factor Authentication (2FA) requirement
        if user.is_2fa_req or user.is_2fa_enabled:
            self.db.commit()
            return AuthResponse(
                status="2fa_required",
                user=self._to_user_response(user),
                message="Two-Factor Authentication (2FA) required to complete login."
            )

        # Update last login timestamp
        user.last_login_at = get_datetime()
        self.db.commit()
        self.db.refresh(user)

        # Check if password change required
        if user.is_pwd_change_req:
            return AuthResponse(
                status="pwd_change_required",
                user=self._to_user_response(user),
                token=f"Bearer temp_session_{user.id[:8]}",
                message="Default password in use. Password change required."
            )

        return AuthResponse(
            status="authenticated",
            user=self._to_user_response(user),
            token=f"Bearer sim_session_token_{user.id[:8]}"
        )

    def unlock_user(self, user_id: str) -> UserResponse:
        """Unlocks a locked user account and resets failed attempt counter."""
        user = self.get_user_by_id(user_id)
        user.is_locked = False
        user.failed_attempts = 0
        self.db.commit()
        self.db.refresh(user)
        return self._to_user_response(user)

    def activate_user(self, user_id: str) -> UserResponse:
        """Activates a user account."""
        user = self.get_user_by_id(user_id)
        user.is_active = True
        self.db.commit()
        self.db.refresh(user)
        return self._to_user_response(user)

    def deactivate_user(self, user_id: str) -> UserResponse:
        """Deactivates a user account."""
        user = self.get_user_by_id(user_id)
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        return self._to_user_response(user)

    def _to_user_response(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_2fa_req=user.is_2fa_req,
            is_2fa_enabled=user.is_2fa_enabled,
            is_pwd_change_req=user.is_pwd_change_req,
            privacy_accepted=user.privacy_accepted or "Y",
            is_locked=user.is_locked,
            failed_attempts=user.failed_attempts,
            is_active=user.is_active,
            created_by=user.created_by or "system",
            created_on=user.created_on.isoformat() if user.created_on else get_datetime().isoformat(),
            last_login_at=user.last_login_at.isoformat() if user.last_login_at else None
        )
