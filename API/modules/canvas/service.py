from core.database import SessionLocal
from core.exceptions import ResourceNotFoundException
from modules.projects.models import Project
from modules.pipeline.models import Pipeline
from modules.canvas.schemas import CanvasSavePayload, CanvasResponse
from modules.pipeline.engine.dag_parser import DAGParser
from utils.datetime_utils import get_datetime, get_datetime_timestamp

class CanvasService:
    """
    Service Layer for Canvas Studio.
    Handles DB transaction management, React Flow DAG persistence, and pre-compiled execution pipeline generation.
    Manages DB session creation and cleanup internally per method execution.
    """

    def save_canvas(self, payload: CanvasSavePayload) -> CanvasResponse:
        """
        Saves or updates React Flow DAG canvas_json, pre-compiling execution graph into 'compiled_pipeline' column.
        """
        db = SessionLocal()
        try:
            if payload.canvas_json and isinstance(payload.canvas_json, dict) and payload.canvas_json.get("nodes"):
                canvas_json = payload.canvas_json
            else:
                canvas_json = {
                    "nodes": payload.nodes,
                    "edges": payload.edges
                }

            # Pre-compile execution graph artifact
            compiled_pipeline = None
            if canvas_json and isinstance(canvas_json, dict) and canvas_json.get("nodes"):
                try:
                    parser = DAGParser(canvas_json)
                    compiled_pipeline = parser.to_compiled_pipeline()
                except Exception:
                    compiled_pipeline = None

            pipeline = None
            if payload.pipeline_id:
                pipeline = db.query(Pipeline).filter(Pipeline.id == payload.pipeline_id).first()

            if pipeline:
                pipeline.canvas_json = canvas_json
                pipeline.compiled_pipeline = compiled_pipeline
                pipeline.name = payload.name
                if payload.project_id and payload.project_id != "proj_default":
                    pipeline.project_id = payload.project_id
                if payload.agent_id:
                    pipeline.agent_id = payload.agent_id
                pipeline.version += 1
                pipeline.updated_at = get_datetime()
            else:
                # Ensure target project exists or create default workspace project
                project_id = payload.project_id or "proj_default"
                project = db.query(Project).filter(Project.id == project_id).first()
                if not project:
                    project = Project(id=project_id, name="Workspace Project", environment="staging")
                    db.add(project)
                    db.commit()
                    db.refresh(project)

                target_agent_id = payload.agent_id or (payload.pipeline_id if payload.pipeline_id and payload.pipeline_id.startswith("agt_") else None)

                pipeline = Pipeline(
                    id=payload.pipeline_id or f"pipe_{get_datetime_timestamp()}",
                    project_id=project.id,
                    agent_id=target_agent_id,
                    name=payload.name,
                    canvas_json=canvas_json,
                    compiled_pipeline=compiled_pipeline,
                    is_active=True,
                    version=1
                )
                db.add(pipeline)

            db.commit()
            db.refresh(pipeline)

            return CanvasResponse(
                pipeline_id=pipeline.id,
                project_id=pipeline.project_id,
                agent_id=pipeline.agent_id,
                name=pipeline.name,
                canvas_json=pipeline.canvas_json,
                is_active=pipeline.is_active,
                version=pipeline.version,
                updated_at=pipeline.updated_at.isoformat()
            )
        finally:
            db.close()

    def get_canvas(self, pipeline_id: str) -> CanvasResponse:
        """
        Retrieves saved canvas_json DAG for a pipeline or agent.
        """
        db = SessionLocal()
        try:
            pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
            if not pipeline:
                pipeline = db.query(Pipeline).filter(Pipeline.agent_id == pipeline_id).first()

            if not pipeline:
                raise ResourceNotFoundException(f"Canvas pipeline '{pipeline_id}' not found.")

            return CanvasResponse(
                pipeline_id=pipeline.id,
                project_id=pipeline.project_id,
                agent_id=pipeline.agent_id,
                name=pipeline.name,
                canvas_json=pipeline.canvas_json or {"nodes": [], "edges": []},
                is_active=pipeline.is_active,
                version=pipeline.version,
                updated_at=pipeline.updated_at.isoformat()
            )
        finally:
            db.close()
