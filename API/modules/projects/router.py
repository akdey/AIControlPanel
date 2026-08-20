from typing import List
from fastapi import APIRouter, status
from modules.projects.schemas import ProjectCreate, ProjectResponse, AgentCreate, AgentResponse
from modules.projects.service import ProjectsService

router = APIRouter(prefix="/projects", tags=["Projects & Agents"])

@router.get("", response_model=List[ProjectResponse])
def get_projects():
    """Fetch all project workspaces with attached agents."""
    service = ProjectsService()
    return service.get_projects()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate):
    """Create a new project workspace and assign gateway team scope."""
    service = ProjectsService()
    return service.create_project(payload)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(project_id: str):
    """Fetch single project details by ID."""
    service = ProjectsService()
    return service.get_project_by_id(project_id)

@router.post("/agents", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(payload: AgentCreate):
    """
    Create a new agent attached to a project workspace,
    and generate an Agent API Key via the Adaptive Layer LLM Gateway.
    """
    service = ProjectsService()
    return await service.create_agent(payload)
