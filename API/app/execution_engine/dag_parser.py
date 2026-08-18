from typing import Dict, Any, List, Optional
from app.core.exceptions import PipelineExecutionException
from app.utils.datetime_utils import get_datetime

class DAGParser:
    """
    Parses React Flow Canvas DAG JSON into executable graph structures.
    Supports single-path decision branches and multi-path Fan-Out execution.
    Supports pre-compiled execution graph serialization/deserialization.
    """

    def __init__(self, canvas_json: Dict[str, Any]):
        self.raw_canvas = canvas_json or {}
        self.nodes: List[Dict[str, Any]] = self.raw_canvas.get("nodes", [])
        self.edges: List[Dict[str, Any]] = self.raw_canvas.get("edges", [])
        self.node_map: Dict[str, Dict[str, Any]] = {n["id"]: n for n in self.nodes}
        self.adjacency_map: Dict[str, List[Dict[str, Any]]] = {}
        self._build_graph()

    def _build_graph(self):
        for node_id in self.node_map:
            self.adjacency_map[node_id] = []

        for edge in self.edges:
            source = edge.get("source")
            target = edge.get("target")
            source_handle = edge.get("sourceHandle")
            target_handle = edge.get("targetHandle")
            
            if source in self.adjacency_map:
                self.adjacency_map[source].append({
                    "target": target,
                    "sourceHandle": source_handle,
                    "targetHandle": target_handle,
                })

    def to_compiled_dag(self) -> Dict[str, Any]:
        """
        Exports a pre-compiled execution graph representation.
        Saved directly in DB column 'compiled_dag' on canvas save to bypass runtime graph parsing.
        """
        start_node_id = self.find_start_node_id() if self.nodes else None
        return {
            "start_node_id": start_node_id,
            "node_map": self.node_map,
            "adjacency_map": self.adjacency_map,
            "compiled_at": get_datetime().isoformat()
        }

    @classmethod
    def from_compiled(cls, compiled_dag: Dict[str, Any]) -> "DAGParser":
        """
        Instantiates a DAGParser directly from pre-compiled execution graph metadata in O(1) time.
        """
        instance = cls.__new__(cls)
        instance.raw_canvas = {}
        instance.node_map = compiled_dag.get("node_map", {})
        instance.nodes = list(instance.node_map.values())
        instance.edges = []
        instance.adjacency_map = compiled_dag.get("adjacency_map", {})
        instance._cached_start_node_id = compiled_dag.get("start_node_id")
        return instance

    def find_start_node_id(self) -> str:
        """Locates the ingestion/start node."""
        if getattr(self, "_cached_start_node_id", None):
            return self._cached_start_node_id

        if not self.nodes:
            raise PipelineExecutionException("Canvas DAG contains no nodes.")

        # 1. Look for explicit prompt / ingestion node type
        for node in self.nodes:
            if node.get("type") in ["prompt", "ingestion", "start", "input"]:
                return node["id"]
            if node.get("data", {}).get("controlId") == "ingestion_node":
                return node["id"]

        # 2. Look for node without incoming edges
        targets = {edge.get("target") for edge in self.edges}
        for node in self.nodes:
            if node["id"] not in targets:
                return node["id"]

        # 3. Fallback to first node
        return self.nodes[0]["id"]

    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        return self.node_map.get(node_id)

    def get_next_node_id(self, current_node_id: str, handle_id: Optional[str] = None) -> Optional[str]:
        """Resolves single target node ID for next execution step with flexible handle matching."""
        targets = self.get_next_node_ids(current_node_id, handle_id=handle_id)
        return targets[0] if targets else None

    def get_next_node_ids(self, current_node_id: str, handle_id: Optional[str] = None) -> List[str]:
        """
        Resolves ALL target node IDs for next execution step.
        Supports multi-path parallel execution (Fan-Out / Broadcast).
        """
        outgoing = self.adjacency_map.get(current_node_id, [])
        if not outgoing:
            return []

        if handle_id:
            matched_targets = []
            for edge in outgoing:
                sh = edge.get("sourceHandle") or ""
                # Exact or suffix/prefix handle match
                if sh == handle_id or sh.endswith(handle_id) or handle_id.endswith(sh):
                    if edge.get("target") and edge["target"] not in matched_targets:
                        matched_targets.append(edge["target"])
            if matched_targets:
                return matched_targets

        # Default: Return all outgoing target node IDs (Fan-Out broadcast to all connected paths)
        targets = []
        for edge in outgoing:
            if edge.get("target") and edge["target"] not in targets:
                targets.append(edge["target"])
        return targets
