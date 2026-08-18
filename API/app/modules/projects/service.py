from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.modules.projects.models import Project, Agent
from app.modules.projects.schemas import ProjectCreate, AgentCreate
from app.adaptive_layer.llm_gateway import get_llm_gateway

class ProjectsService:
    """
    Service Layer for Projects & Agents Workspaces.
    Encapsulates DB transaction management and Adaptive Layer Gateway provisioning.
    """

    def __init__(self, db: Session):
        self.db = db
        self.llm_gateway = get_llm_gateway()

    def get_projects(self) -> List[Project]:
        """Fetch all project workspaces with attached agents."""
        return self.db.query(Project).all()

    def get_project_by_id(self, project_id: str) -> Project:
        """Fetch single project details by ID."""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    def create_project(self, payload: ProjectCreate) -> Project:
        """Create a new project workspace and assign gateway team scope."""
        db_project = Project(
            name=payload.name,
            description=payload.description,
            environment=payload.environment,
            status=payload.status or "pre-published",
            gateway_team_id=f"team_{payload.name.lower().replace(' ', '_')}"
        )
        self.db.add(db_project)
        self.db.commit()
        self.db.refresh(db_project)
        return db_project

    async def create_agent(self, payload: AgentCreate) -> Agent:
        """
        Create a new agent attached to a project workspace,
        and generate an Agent API Key via the Adaptive Layer LLM Gateway.
        """
        project = self.db.query(Project).filter(Project.id == payload.projectId).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent Project not found")

        db_agent = Agent(
            project_id=payload.projectId,
            name=payload.name,
            role=payload.role,
            model=payload.model,
            monthly_limit=payload.monthly_limit,
            status="active"
        )
        self.db.add(db_agent)
        self.db.commit()
        self.db.refresh(db_agent)

        # Generate Agent API Key via Adaptive Layer LLM Gateway
        key_info = await self.llm_gateway.generate_agent_key(
            agent_id=db_agent.id,
            agent_name=db_agent.name,
            team_id=project.gateway_team_id
        )
        db_agent.api_key_hash = key_info.get("key")
        self.db.commit()
        self.db.refresh(db_agent)

        return db_agent
