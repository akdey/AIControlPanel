from fastapi import APIRouter
from app.modules.canvas.schemas import CanvasSavePayload, CanvasResponse
from app.modules.canvas.service import CanvasService

router = APIRouter(prefix="/canvas", tags=["Canvas Studio"])

@router.post("/save", response_model=CanvasResponse)
def save_canvas(payload: CanvasSavePayload):
    """
    Saves or updates the React Flow DAG topology canvas_json in SQLite.
    Delegates DB transaction management and pre-compilation to CanvasService.
    """
    service = CanvasService()
    return service.save_canvas(payload)

@router.get("/{pipeline_id}", response_model=CanvasResponse)
def get_canvas(pipeline_id: str):
    """
    Retrieves saved canvas_json DAG for a pipeline or agent.
    """
    service = CanvasService()
    return service.get_canvas(pipeline_id)
