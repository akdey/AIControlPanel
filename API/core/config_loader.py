import json
from pathlib import Path
from typing import Dict, Any

CONFIG_FILE_PATH = Path(__file__).parent.parent / "config_data" / "config.json"

def _load_config() -> Dict[str, Any]:
    """Loads central configuration dictionary directly from config.json at application startup."""
    if CONFIG_FILE_PATH.exists():
        try:
            with open(CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            raise RuntimeError(f"Failed to load configuration from {CONFIG_FILE_PATH}: {e}")
    raise FileNotFoundError(f"Central configuration file not found at {CONFIG_FILE_PATH}")

# Global Singleton Config Dictionary
config_data: Dict[str, Any] = _load_config()
