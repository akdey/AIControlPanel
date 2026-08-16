from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# Agent Schemas
class AgentBase(BaseModel):
    name: str
    role: str = "Autonomous Task Exec"
    model: str = "gpt-4o"
    monthly_limit: float = 1000.0

class AgentCreate(AgentBase):
    projectId: str

class AgentResponse(AgentBase):
    id: str
    project_id: str
    monthly_spend: float = 0.0
    status: str = "active"
    api_key_hash: Optional[str] = None
    policy_profile_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    environment: str = "staging"

class ProjectCreate(ProjectBase):
    status: str = "pre-published"

class ProjectResponse(ProjectBase):
    id: str
    status: str = "pre-published"
    gateway_team_id: Optional[str] = None
    created_at: datetime
    agents: List[AgentResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
