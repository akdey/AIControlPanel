import os
import json
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, status, Path

router = APIRouter(prefix="/controls", tags=["Controls Registry"])

CONTROLS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config_data", "controls")

@router.get("/palette", response_model=Dict[str, Any])
@router.get("/categories", response_model=Dict[str, Any])
def get_control_categories_and_palette():
    """
    Returns categories, subcategories, and controls summary list
    required to render the frontend node palette drawer.
    """
    categories_path = os.path.join(CONTROLS_DIR, "categories.json")
    if not os.path.exists(categories_path):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Control categories configuration not found."
        )

    with open(categories_path, "r", encoding="utf-8") as f:
        categories_data = json.load(f)

    # Load all individual control JSONs in CONTROLS_DIR
    controls_list = []
    if os.path.exists(CONTROLS_DIR):
        for filename in sorted(os.listdir(CONTROLS_DIR)):
            if filename.endswith(".json") and filename != "categories.json":
                file_path = os.path.join(CONTROLS_DIR, filename)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        ctrl = json.load(f)
                        controls_list.append(ctrl)
                except Exception as e:
                    print(f"Error reading control file {filename}: {e}")

    categories_data["controls"] = controls_list
    return categories_data

@router.get("/getagentcontrol/{name}", response_model=Dict[str, Any])
@router.get("/{name}", response_model=Dict[str, Any])
def get_agent_control(name: str = Path(..., description="Control name or ID, e.g. ctrl_pii_masking")):
    """
    Returns the individual JSON definition for a specific agent control node.
    Matches filename (e.g., ctrl_pii_masking.json) or control ID/name.
    """
    clean_name = name.strip()
    if not clean_name.endswith(".json"):
        target_filename = f"{clean_name}.json"
    else:
        target_filename = clean_name

    target_path = os.path.join(CONTROLS_DIR, target_filename)

    # 1. Direct file match check
    if os.path.exists(target_path) and os.path.basename(target_path) != "categories.json":
        with open(target_path, "r", encoding="utf-8") as f:
            return json.load(f)

    # 2. Search by control 'id' or 'name' inside files
    if os.path.exists(CONTROLS_DIR):
        for filename in os.listdir(CONTROLS_DIR):
            if filename.endswith(".json") and filename != "categories.json":
                file_path = os.path.join(CONTROLS_DIR, filename)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        ctrl = json.load(f)
                        if ctrl.get("id") == clean_name or ctrl.get("name") == clean_name:
                            return ctrl
                except Exception:
                    pass

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Agent control definition for '{name}' not found."
    )
