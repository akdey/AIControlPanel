import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Agent Governance Control Plane API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration (SQLite by default)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./control_plane.db")
    
    # Adaptive Layer LiteLLM Admin Configs
    LITELLM_MASTER_KEY: str = os.getenv("LITELLM_MASTER_KEY", "sk-litellm-master-key")
    LITELLM_HOST: str = os.getenv("LITELLM_HOST", "http://localhost:4000")
    
    # Adaptive Layer Langfuse Configs
    LANGFUSE_PUBLIC_KEY: str = os.getenv("LANGFUSE_PUBLIC_KEY", "pk-lf-mock-key")
    LANGFUSE_SECRET_KEY: str = os.getenv("LANGFUSE_SECRET_KEY", "sk-lf-mock-key")
    LANGFUSE_HOST: str = os.getenv("LANGFUSE_HOST", "http://localhost:3000")

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
