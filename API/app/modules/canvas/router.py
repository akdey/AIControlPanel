from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.projects.models import Pipeline, Project
from app.modules.canvas.schemas import CanvasSavePayload, CanvasResponse
from app.utils.datetime_utils import get_datetime, get_datetime_timestamp

router = APIRouter(prefix="/canvas", tags=["Canvas Studio"])

@router.post("/save", response_model=CanvasResponse)
def save_canvas(payload: CanvasSavePayload, db: Session = Depends(get_db)):
    """
    Saves or updates the React Flow DAG topology canvas_json in SQLite,
    associating it with the target project_id and agent_id.
    """
    if payload.canvas_json and isinstance(payload.canvas_json, dict) and payload.canvas_json.get("nodes"):
        canvas_json = payload.canvas_json
    else:
        canvas_json = {
            "nodes": payload.nodes,
            "edges": payload.edges
        }

    pipeline = None
    if payload.pipeline_id:
        pipeline = db.query(Pipeline).filter(Pipeline.id == payload.pipeline_id).first()

    if pipeline:
        pipeline.canvas_json = canvas_json
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

@router.get("/{pipeline_id}", response_model=CanvasResponse)
def get_canvas(pipeline_id: str, db: Session = Depends(get_db)):
    """
    Retrieves saved canvas_json DAG for a pipeline or agent.
    """
    # 1. Try finding by direct pipeline ID
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    
    # 2. Try finding by agent ID
    if not pipeline:
        pipeline = db.query(Pipeline).filter(Pipeline.agent_id == pipeline_id).first()

    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Canvas pipeline '{pipeline_id}' not found."
        )

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
