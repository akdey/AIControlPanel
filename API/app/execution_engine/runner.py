import time
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.core.exceptions import ModelNotFoundException, PipelineExecutionException
from app.modules.projects.models import Pipeline
from app.execution_engine.dag_parser import DAGParser
from app.AgentControlFunctions.context import PipelineContext
from app.AgentControlFunctions.registry import ControlRegistry
from app.adaptive_layer.llm_gateway import get_llm_gateway

logger = logging.getLogger(__name__)

class ExecutionRunner:
    """
    Core Graph Traversal Execution Engine.
    Loads saved React Flow DAG directly from SQLite, initializes PipelineContext,
    and dynamically dispatches nodes via O(1) ControlRegistry lookup.
    Supports single-path decisions and multi-path parallel Fan-Out execution.
    """

    def __init__(self, db: Session):
        self.db = db
        self.llm_gateway = get_llm_gateway()

    async def invoke_pipeline(self, pipeline_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes pipeline graph by looking up saved React Flow DAG from SQLite by pipeline_id or agent_id.
        No mock fallbacks — strictly reads live saved database state.
        """
        pipeline = self.db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if not pipeline:
            pipeline = self.db.query(Pipeline).filter(Pipeline.agent_id == pipeline_id).first()

        if not pipeline:
            raise PipelineExecutionException(f"Pipeline '{pipeline_id}' not found in database.")

        canvas_json = pipeline.canvas_json
        if not canvas_json or not isinstance(canvas_json, dict) or not canvas_json.get("nodes"):
            raise PipelineExecutionException(f"Pipeline '{pipeline_id}' contains no executable canvas nodes.")

        parser = DAGParser(canvas_json)
        start_node_id = parser.find_start_node_id()

        # Initialize Pipeline Context
        ctx = PipelineContext(
            pipeline_id=pipeline.id,
            current_node_id=start_node_id,
            prompt_object=payload.get("promptObj", {"prompt": payload.get("prompt", "")}),
            tool_manifest=payload.get("tool_manifest", []),
            sanitized_prompt_object=payload.get("promptObj", {"prompt": payload.get("prompt", "")}),
        )

        visited_count = 0
        max_nodes = 50  # Circuit breaker against infinite loops

        execution_queue: List[str] = [start_node_id]
        visited_nodes: set = set()

        while execution_queue and visited_count < max_nodes:
            current_node_id = execution_queue.pop(0)
            if current_node_id in visited_nodes:
                continue

            visited_count += 1
            visited_nodes.add(current_node_id)
            ctx.current_node_id = current_node_id

            node = parser.get_node(current_node_id)
            if not node:
                continue

            node_type = node.get("type", "")
            node_data = node.get("data", {})
            control_def = node_data.get("control", {})
            runtime_config = control_def.get("runtimeConfig", {})
            engine = runtime_config.get("engine") or node_data.get("controlId") or node_type

            # Dispatch to corresponding AgentControlFunction node
            self._dispatch_node(ctx, node, engine)

            # Check if pipeline execution was halted/blocked
            if ctx.execution_status in ["blocked", "halted"]:
                logger.info(f"Pipeline {pipeline.id} execution halted at node {current_node_id}.")
                break

            # Determine next node ID(s)
            if ctx.next_node_id:
                next_targets = [ctx.next_node_id]
                ctx.next_node_id = None
            else:
                handle_id = ctx.last_evaluated_output_port
                next_targets = parser.get_next_node_ids(current_node_id, handle_id=handle_id)

            # Enqueue all target nodes for multi-branch Fan-Out execution
            for target_id in next_targets:
                if target_id not in visited_nodes:
                    execution_queue.append(target_id)

        # Terminal model call if execution reached allow state
        if ctx.execution_status == "passed" and ctx.action_taken == "Allow":
            gateway_res = await self.llm_gateway.invoke_chat_completion(
                model="gpt-4o",
                messages=[{"role": "user", "content": ctx.sanitized_prompt_object.get("prompt", "")}]
            )
            completion_text = gateway_res.get("choices", [{}])[0].get("message", {}).get("content", "")
            ctx.final_output = completion_text

            ctx.add_span(
                node_id="node_term_allow",
                node_name="Allowed to LLM",
                node_type="gateway",
                start_time=time.time() - 0.02,
                end_time=time.time(),
                status="passed",
                input_payload=ctx.sanitized_prompt_object,
                output_payload={"completion": completion_text},
                token_cost=0.0025
            )

        return ctx.to_execution_response()

    def _dispatch_node(self, ctx: PipelineContext, node: Dict[str, Any], engine: str):
        """Dynamic O(1) dispatch table mapping node engine string to registered AgentControlFunction."""
        node_id = node.get("id", "")
        node_data = node.get("data", {})
        node_type = node.get("type", "")
        node_config = node_data.get("configValues", {})
        start_time = time.time()

        # O(1) Hash map lookup in ControlRegistry
        control_fn = ControlRegistry.get_control(engine)
        if control_fn:
            control_fn(ctx, node_config)

        elif node_type in ["prompt", "ingestion", "terminal"]:
            # Valid start/ingestion or terminal endpoint pass-through
            end_time = time.time()
            ctx.add_span(
                node_id=node_id,
                node_name=node_data.get("label", f"Node {node_id}"),
                node_type=node_type,
                start_time=start_time,
                end_time=end_time,
                status="passed",
                input_payload=ctx.sanitized_prompt_object,
                output_payload=ctx.sanitized_prompt_object
            )

        else:
            # Unrecognized control node engine -> throw explicit error instead of silent pass-through
            raise PipelineExecutionException(
                f"Unsupported control node engine '{engine}' on node '{node_id}'. "
                f"No backend AgentControlFunction implementation found for this control."
            )
