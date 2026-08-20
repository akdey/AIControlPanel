import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.logger_config import setup_logging
from core.logging_middleware import RequestResponseLoggingMiddleware
from core.database import engine, Base, SessionLocal
from modules.projects.models import Project, Agent
from modules.pipeline.models import Pipeline
from modules.users.models import User
from modules.users.service import hash_password
from core.config_loader import config_data
from modules.projects.router import router as projects_router
from modules.canvas.router import router as canvas_router
from modules.pipeline.router import router as pipeline_router
from modules.observability.router import router as observability_router
from modules.finops.router import router as finops_router
from modules.controls.router import router as controls_router
from modules.users.router import users_router, auth_router

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

        if db.query(User).count() == 0:
            hpwd, salt = hash_password(config_data.get("DEFAULT_PASSWORD", "Admin@123"))
            admin_user = User(
                username="admin",
                password=hpwd,
                role=config_data.get("ROLES", {}).get("SUPER_ADMIN", "super_admin"),
                secret=salt,
                created_by="system",
                created_on=get_datetime()
            )
            db.add(admin_user)

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

from core.rbac_middleware import JWTAuthRBACMiddleware

# JWT Authentication & RBAC Route Access Control Middleware
app.add_middleware(JWTAuthRBACMiddleware)

# Request & Response Audit Logging Middleware
app.add_middleware(RequestResponseLoggingMiddleware)

from fastapi import Request
from fastapi.responses import JSONResponse
from core.exceptions import BaseAppException
from utils.datetime_utils import get_datetime

@app.exception_handler(BaseAppException)
async def domain_exception_handler(request: Request, exc: BaseAppException):
    """Global handler for domain-level business exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error_code": exc.error_code,
            "detail": exc.detail,
            "extra": exc.extra,
            "timestamp": get_datetime().isoformat()
        }
    )

# Include Routers with /api/v1 prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
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
