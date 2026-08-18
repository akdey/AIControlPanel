import hashlib
import os
from typing import List, Optional
from sqlalchemy.orm import Session
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
    Handles DB transactions, password hashing, failed attempt counting, and account locking.
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
        """Creates a new user with hashed password."""
        existing = self.db.query(User).filter(User.username == payload.username).first()
        if existing:
            raise BaseAppException(f"Username '{payload.username}' already exists.", status_code=400, error_code="USERNAME_TAKEN")

        hashed_pwd, salt = hash_password(payload.password)
        db_user = User(
            username=payload.username,
            password=hashed_pwd,
            role=payload.role or "secops_admin",
            is_2fa_req=payload.is_2fa_req or False,
            secret=salt,
            created_by=created_by
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return self._to_user_response(db_user)

    def authenticate_user(self, payload: AuthenticatePayload) -> AuthResponse:
        """
        Authenticates user login credentials.
        Increments failed_attempts on bad password and locks account after 5 consecutive failures.
        """
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
            if user.failed_attempts >= 5:
                user.is_locked = True
                self.db.commit()
                raise AccountLockedException("User account has been locked after 5 consecutive failed login attempts.")
            self.db.commit()
            raise UnauthorizedOperationException(f"Invalid username or password. ({5 - user.failed_attempts} attempts remaining)")

        # Successful login
        user.failed_attempts = 0
        user.last_login_at = get_datetime()
        self.db.commit()
        self.db.refresh(user)

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
