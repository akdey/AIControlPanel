from typing import List
from fastapi import APIRouter, status
from app.modules.users.schemas import UserCreate, UserResponse, AuthenticatePayload, AuthResponse
from app.modules.users.service import UserService

auth_router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])
users_router = APIRouter(prefix="/users", tags=["User Management"])

@auth_router.post("/authenticate", response_model=AuthResponse)
def authenticate(payload: AuthenticatePayload):
    """Authenticates user login credentials."""
    service = UserService()
    return service.authenticate_user(payload)

@users_router.get("", response_model=List[UserResponse])
def get_users():
    """Fetch all registered users."""
    service = UserService()
    return service.get_users()

@users_router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate):
    """Create a new user account."""
    service = UserService()
    return service.create_user(payload)

@users_router.post("/unlock/{user_id}", response_model=UserResponse)
def unlock_user(user_id: str):
    """Unlocks a locked user account and resets failed attempt counter."""
    service = UserService()
    return service.unlock_user(user_id)

@users_router.post("/activate/{user_id}", response_model=UserResponse)
def activate_user(user_id: str):
    """Activates a user account."""
    service = UserService()
    return service.activate_user(user_id)

@users_router.post("/deactive/{user_id}", response_model=UserResponse)
def deactivate_user(user_id: str):
    """Deactivates a user account."""
    service = UserService()
    return service.deactivate_user(user_id)
