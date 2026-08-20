import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime
from core.database import Base
from utils.datetime_utils import get_datetime

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # Hashed password string
    role = Column(String(50), nullable=False, default="secops_admin")
    is_2fa_req = Column(Boolean, default=False)
    is_2fa_enabled = Column(Boolean, default=False)
    is_pwd_change_req = Column(Boolean, default=False)
    secret = Column(String(255), nullable=True)  # 2FA secret key / salt
    privacy_accepted = Column(String(10), default="Y")
    is_locked = Column(Boolean, default=False)
    failed_attempts = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_by = Column(String(100), default="system")
    created_on = Column(DateTime(timezone=True), default=get_datetime)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
