import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.utils.datetime_utils import get_datetime

def generate_uuid():
    return str(uuid.uuid4())

class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    canvas_json = Column(JSON, nullable=False, default=dict)  # Full React Flow DAG nodes and edges
    compiled_pipeline = Column(JSON, nullable=True)  # Pre-compiled fast execution graph artifact
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=get_datetime)
    updated_at = Column(DateTime(timezone=True), default=get_datetime, onupdate=get_datetime)

    # Relationships
    project = relationship("Project", back_populates="pipelines")
    agent = relationship("Agent", back_populates="pipelines")
