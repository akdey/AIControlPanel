import json
from pathlib import Path
from typing import Dict, Any

CONFIG_FILE_PATH = Path(__file__).parent.parent / "config_data" / "config.json"

def _load_config() -> Dict[str, Any]:
    """Loads central configuration dictionary from config.json once at application startup."""
    default_config = {
        "DEFAULT_PASSWORD": "DefaultUser@123!",
        "MAX_FAILED_LOGIN_ATTEMPTS": 5,
        "LOCKOUT_DURATION_MINUTES": 15,
        "DEFAULT_PRIVACY_ACCEPTED": "Y",
        "DEFAULT_2FA_REQUIRED": True,
        "ROLES": {
            "ADMIN": "secops_admin",
            "SUPER_ADMIN": "super_admin",
            "AUDITOR": "compliance_auditor"
        }
    }
    if CONFIG_FILE_PATH.exists():
        try:
            with open(CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                default_config.update(loaded)
        except Exception:
            pass
    return default_config

# Global Singleton Config Dictionary
config_data: Dict[str, Any] = _load_config()
