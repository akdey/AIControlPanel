import re
from typing import Dict, List, Any
from core.config import settings

def get_role_permissions() -> Dict[str, List[Dict[str, Any]]]:
    """
    Dynamically constructs Role Permission Matrix using settings.API_V1_STR prefix.
    Prevents hardcoding API route version strings.
    """
    api_prefix = settings.API_V1_STR  # e.g. "/api/v1"
    
    return {
        "super_admin": [
            {"methods": ["*"], "pattern": r"^/.*$"}  # Full Unrestricted Access
        ],
        "secops_admin": [
            {"methods": ["GET", "POST", "PUT", "DELETE"], "pattern": rf"^{api_prefix}/canvas(/.*)?$"},
            {"methods": ["GET", "POST", "PUT", "DELETE"], "pattern": rf"^{api_prefix}/controls(/.*)?$"},
            {"methods": ["GET", "POST"], "pattern": rf"^{api_prefix}/pipeline(/.*)?$"},
            {"methods": ["GET"], "pattern": rf"^{api_prefix}/finops(/.*)?$"},
            {"methods": ["GET"], "pattern": rf"^{api_prefix}/observability(/.*)?$"},
            {"methods": ["GET"], "pattern": rf"^{api_prefix}/projects(/.*)?$"},
            {"methods": ["GET"], "pattern": rf"^{api_prefix}/users(/.*)?$"}
        ],
        "developer": [
            {"methods": ["GET", "POST", "PUT"], "pattern": rf"^{api_prefix}/canvas(/.*)?$"},
            {"methods": ["GET"], "pattern": rf"^{api_prefix}/controls(/.*)?$"},
            {"methods": ["POST"], "pattern": rf"^{api_prefix}/pipeline/invoke(/.*)?$"},
            {"methods": ["GET"], "pattern": rf"^{api_prefix}/observability(/.*)?$"},
            {"methods": ["GET"], "pattern": rf"^{api_prefix}/projects(/.*)?$"}
        ],
        "api_client": [
            {"methods": ["POST"], "pattern": rf"^{api_prefix}/pipeline/invoke(/.*)?$"},
            {"methods": ["GET"], "pattern": r"^/health$"}
        ]
    }

def is_route_allowed_for_role(role: str, path: str, method: str) -> bool:
    """Validates whether a user role is permitted to perform target HTTP method on route path."""
    if not role:
        return False
        
    permissions = get_role_permissions().get(role, [])
    for perm in permissions:
        allowed_methods = perm.get("methods", [])
        pattern = perm.get("pattern", "")
        
        if "*" in allowed_methods or method.upper() in allowed_methods:
            if re.match(pattern, path):
                return True
                
    return False
