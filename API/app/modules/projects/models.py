import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.utils.datetime_utils import get_datetime

def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    environment = Column(String(50), nullable=False, default="staging")
    status = Column(String(50), nullable=False, default="pre-published")
    gateway_team_id = Column(String(255), nullable=True)  # LiteLLM Team mapping ID
    created_at = Column(DateTime(timezone=True), default=get_datetime)
    updated_at = Column(DateTime(timezone=True), default=get_datetime, onupdate=get_datetime)

    # Relationships
    agents = relationship("Agent", back_populates="project", cascade="all, delete-orphan")
    pipelines = relationship("Pipeline", back_populates="project", cascade="all, delete-orphan")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False, default="Autonomous Task Exec")
    model = Column(String(100), nullable=False, default="gpt-4o")
    monthly_spend = Column(Float, default=0.0)
    monthly_limit = Column(Float, default=1000.0)
    status = Column(String(50), default="active")  # active, rate_limited, quarantined, idle
    api_key_hash = Column(String(255), nullable=True)
    policy_profile_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_datetime)
    updated_at = Column(DateTime(timezone=True), default=get_datetime, onupdate=get_datetime)

    # Relationships
    project = relationship("Project", back_populates="agents")
    pipelines = relationship("Pipeline", back_populates="agent", cascade="all, delete-orphan")
