from typing import List
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal
from app.core.exceptions import ResourceNotFoundException
from app.modules.projects.models import Project, Agent
from app.modules.projects.schemas import ProjectCreate, ProjectResponse, AgentCreate, AgentResponse
from app.adaptive_layer.llm_gateway import get_llm_gateway

class ProjectsService:
    """
    Service Layer for Projects & Agents Workspaces.
    Encapsulates DB transaction management and Adaptive Layer Gateway provisioning.
    Manages DB session creation and cleanup internally per method execution.
    """

    def __init__(self):
        self.llm_gateway = get_llm_gateway()

    def get_projects(self) -> List[ProjectResponse]:
        """Fetch all project workspaces with attached agents using eager loading."""
        db = SessionLocal()
        try:
            projects = db.query(Project).options(joinedload(Project.agents)).all()
            return [ProjectResponse.model_validate(p) for p in projects]
        finally:
            db.close()

    def get_project_by_id(self, project_id: str) -> ProjectResponse:
        """Fetch single project details by ID using eager loading."""
        db = SessionLocal()
        try:
            project = db.query(Project).options(joinedload(Project.agents)).filter(Project.id == project_id).first()
            if not project:
                raise ResourceNotFoundException(f"Project with ID '{project_id}' not found.")
            return ProjectResponse.model_validate(project)
        finally:
            db.close()

    def create_project(self, payload: ProjectCreate) -> ProjectResponse:
        """Create a new project workspace and assign gateway team scope."""
        db = SessionLocal()
        try:
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
            return ProjectResponse.model_validate(db_project)
        finally:
            db.close()

    async def create_agent(self, payload: AgentCreate) -> AgentResponse:
        """
        Create a new agent attached to a project workspace,
        and generate an Agent API Key via the Adaptive Layer LLM Gateway.
        """
        db = SessionLocal()
        try:
            project = db.query(Project).filter(Project.id == payload.projectId).first()
            if not project:
                raise ResourceNotFoundException(f"Parent Project with ID '{payload.projectId}' not found.")

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
            key_info = await self.llm_gateway.generate_agent_key(
                agent_id=db_agent.id,
                agent_name=db_agent.name,
                team_id=project.gateway_team_id
            )
            db_agent.api_key_hash = key_info.get("key")
            db.commit()
            db.refresh(db_agent)

            return AgentResponse.model_validate(db_agent)
        finally:
            db.close()
