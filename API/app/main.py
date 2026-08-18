import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logger_config import setup_logging
from app.core.logging_middleware import RequestResponseLoggingMiddleware
from app.core.database import engine, Base, SessionLocal
from app.modules.projects.models import Project, Agent
from app.modules.pipeline.models import Pipeline
from app.modules.projects.router import router as projects_router
from app.modules.canvas.router import router as canvas_router
from app.modules.pipeline.router import router as pipeline_router
from app.modules.observability.router import router as observability_router
from app.modules.finops.router import router as finops_router
from app.modules.controls.router import router as controls_router

# Initialize stdout & persistent file logger (logs/control_plane.log)
logger = setup_logging()


def seed_initial_data():
    """Seeds SQLite DB with default initial project, agent, and pipeline if empty."""
    db = SessionLocal()
    try:
        if db.query(Project).count() == 0:
            logger.info("Seeding initial database workspace data...")
            proj = Project(
                id="proj_001",
                name="Enterprise AI Core",
                description="Primary workspace for agent governance & controls",
                environment="production",
                gateway_team_id="team_enterprise_ai"
            )
            db.add(proj)

            agent = Agent(
                id="agt_001",
                project_id="proj_001",
                name="Customer Support Agent",
                role="Autonomous Task Exec",
                model="gpt-4o",
                monthly_spend=820.50,
                monthly_limit=2000.0,
                status="active"
            )
            db.add(agent)
            db.commit()
            logger.info("Database seeding completed.")
    except Exception as e:
        logger.error(f"Failed to seed initial data: {e}")
        db.rollback()
    finally:
        db.close()

from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE pipelines ADD COLUMN compiled_pipeline JSON;"))
            conn.commit()
        except Exception:
            pass
    seed_initial_data()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request & Response Audit Logging Middleware
app.add_middleware(RequestResponseLoggingMiddleware)

# Include Routers with /api/v1 prefix
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(canvas_router, prefix=settings.API_V1_STR)
app.include_router(pipeline_router, prefix=settings.API_V1_STR)
app.include_router(observability_router, prefix=settings.API_V1_STR)
app.include_router(finops_router, prefix=settings.API_V1_STR)
app.include_router(controls_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Enterprise Agent Governance Control Plane API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
