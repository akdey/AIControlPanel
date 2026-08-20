import re
from typing import Dict, List

# Role Permission Matrix mapping roles to allowed URL path regex patterns & methods
ROLE_PERMISSIONS: Dict[str, List[Dict[str, Any]]] = {
    "super_admin": [
        {"methods": ["*"], "pattern": r"^/.*$"}  # Full Unrestricted Access
    ],
    "secops_admin": [
        {"methods": ["GET", "POST", "PUT", "DELETE"], "pattern": r"^/api/v1/canvas(/.*)?$"},
        {"methods": ["GET", "POST", "PUT", "DELETE"], "pattern": r"^/api/v1/controls(/.*)?$"},
        {"methods": ["GET", "POST"], "pattern": r"^/api/v1/pipeline(/.*)?$"},
        {"methods": ["GET"], "pattern": r"^/api/v1/finops(/.*)?$"},
        {"methods": ["GET"], "pattern": r"^/api/v1/observability(/.*)?$"},
        {"methods": ["GET"], "pattern": r"^/api/v1/projects(/.*)?$"},
        {"methods": ["GET"], "pattern": r"^/api/v1/users(/.*)?$"}
    ],
    "developer": [
        {"methods": ["GET", "POST", "PUT"], "pattern": r"^/api/v1/canvas(/.*)?$"},
        {"methods": ["GET"], "pattern": r"^/api/v1/controls(/.*)?$"},
        {"methods": ["POST"], "pattern": r"^/api/v1/pipeline/invoke(/.*)?$"},
        {"methods": ["GET"], "pattern": r"^/api/v1/observability(/.*)?$"},
        {"methods": ["GET"], "pattern": r"^/api/v1/projects(/.*)?$"}
    ],
    "api_client": [
        {"methods": ["POST"], "pattern": r"^/api/v1/pipeline/invoke(/.*)?$"},
        {"methods": ["GET"], "pattern": r"^/health$"}
    ]
}

def is_route_allowed_for_role(role: str, path: str, method: str) -> bool:
    """Validates whether a user role is permitted to perform target HTTP method on route path."""
    if not role:
        return False
        
    permissions = ROLE_PERMISSIONS.get(role, [])
    for perm in permissions:
        allowed_methods = perm.get("methods", [])
        pattern = perm.get("pattern", "")
        
        if "*" in allowed_methods or method.upper() in allowed_methods:
            if re.match(pattern, path):
                return True
                
    return False
