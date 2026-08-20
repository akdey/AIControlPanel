import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from core.config import settings
from core.logger_config import setup_logging
from core.database import engine, Base, SessionLocal
from core.config_loader import config_data
from core.exceptions import BaseAppException
from middlewares.logging_middleware import RequestResponseLoggingMiddleware
from middlewares.rbac_middleware import JWTAuthRBACMiddleware
from modules.projects.models import Project, Agent
from modules.pipeline.models import Pipeline
from modules.users.models import User
from modules.users.service import hash_password
from utils.datetime_utils import get_datetime

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
    """Seeds SQLite DB with default admin user (admin / Admin@123) if not present."""
    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == "admin").count() == 0:
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
            logger.info("Default admin user created (admin / Admin@123).")
    except Exception as e:
        logger.error(f"Failed to seed initial admin user: {e}")
        db.rollback()
    finally:
        db.close()

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

# JWT Authentication & RBAC Route Access Control Middleware
app.add_middleware(JWTAuthRBACMiddleware)

# Request & Response Audit Logging Middleware
app.add_middleware(RequestResponseLoggingMiddleware)

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

# Include Routers with settings.API_V1_STR prefix dynamically
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
