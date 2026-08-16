from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.projects.models import Project, Agent, Pipeline
from app.modules.projects.schemas import ProjectCreate, ProjectResponse, AgentCreate, AgentResponse
from app.adaptive_layer.llm_gateway import get_llm_gateway

router = APIRouter(prefix="/projects", tags=["Projects & Agents"])
llm_gateway = get_llm_gateway()

@router.get("", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    """Fetch all project workspaces with attached agents."""
    return db.query(Project).all()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project workspace and assign gateway team scope."""
    db_project = Project(
        name=payload.name,
        description=payload.description,
        environment=payload.environment,
        status=payload.status or "pre-published",
        gateway_team_id=f"team_{payload.name.lower().replace(' ', '_')}"
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(project_id: str, db: Session = Depends(get_db)):
    """Fetch single project details by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/agents", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(payload: AgentCreate, db: Session = Depends(get_db)):
    """
    Create a new agent attached to a project workspace,
    and generate an Agent API Key via the Adaptive Layer LLM Gateway.
    """
    project = db.query(Project).filter(Project.id == payload.projectId).first()
    if not project:
        raise HTTPException(status_code=404, detail="Parent Project not found")

    db_agent = Agent(
        project_id=payload.projectId,
        name=payload.name,
        role=payload.role,
        model=payload.model,
        monthly_limit=payload.monthly_limit,
        status="active"
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)

    # Generate Agent API Key via Adaptive Layer LLM Gateway
    key_info = await llm_gateway.generate_agent_key(
        agent_id=db_agent.id,
        agent_name=db_agent.name,
        team_id=project.gateway_team_id
    )
    db_agent.api_key_hash = key_info.get("key")
    db.commit()
    db.refresh(db_agent)

    return db_agent
