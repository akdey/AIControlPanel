from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.canvas.schemas import CanvasSavePayload, CanvasResponse
from app.modules.canvas.service import CanvasService

router = APIRouter(prefix="/canvas", tags=["Canvas Studio"])

@router.post("/save", response_model=CanvasResponse)
def save_canvas(payload: CanvasSavePayload, db: Session = Depends(get_db)):
    """
    Saves or updates the React Flow DAG topology canvas_json in SQLite.
    Delegates DB transaction management and pre-compilation to CanvasService.
    """
    service = CanvasService(db)
    return service.save_canvas(payload)

@router.get("/{pipeline_id}", response_model=CanvasResponse)
def get_canvas(pipeline_id: str, db: Session = Depends(get_db)):
    """
    Retrieves saved canvas_json DAG for a pipeline or agent.
    """
    service = CanvasService(db)
    return service.get_canvas(pipeline_id)
