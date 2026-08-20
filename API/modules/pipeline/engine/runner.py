import time
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from core.exceptions import ModelNotFoundException, PipelineExecutionException
from modules.pipeline.models import Pipeline
from modules.pipeline.engine.dag_parser import DAGParser
from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import ControlRegistry
from adaptive_layer.llm_gateway import get_llm_gateway

logger = logging.getLogger(__name__)

class ExecutionRunner:
    """
    Core Graph Traversal Execution Engine.
    Loads saved React Flow DAG directly from SQLite, initializes PipelineContext,
    and dynamically dispatches nodes via O(1) ControlRegistry lookup.
    Supports single-path decisions, multi-path parallel Fan-Out, and dynamic port-to-port binding.
    """

    def __init__(self, db: Session):
        self.db = db
        self.llm_gateway = get_llm_gateway()

    async def invoke_pipeline(self, pipeline_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes pipeline graph by looking up saved React Flow DAG from SQLite by pipeline_id or agent_id.
        No mock fallbacks — strictly reads live saved database state.
        Uses pre-compiled pipeline graph artifact with dynamic incoming_map for sub-millisecond execution.
        """
        pipeline = self.db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if not pipeline:
            pipeline = self.db.query(Pipeline).filter(Pipeline.agent_id == pipeline_id).first()

        if not pipeline:
            raise PipelineExecutionException(f"Pipeline '{pipeline_id}' not found in database.")

        if pipeline.compiled_pipeline and isinstance(pipeline.compiled_pipeline, dict) and pipeline.compiled_pipeline.get("start_node_id"):
            parser = DAGParser.from_compiled(pipeline.compiled_pipeline)
        else:
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
            tool_manifest=payload.get("tool_manifest", [])
        )

        trace_spans: List[Dict[str, Any]] = []
        
        # Traverse execution graph via Queue (supports Fan-Out parallel paths)
        queue: List[str] = [start_node_id]
        visited = set()

        while queue:
            current_node_id = queue.pop(0)
            if current_node_id in visited:
                continue
            visited.add(current_node_id)

            ctx.current_node_id = current_node_id
            node = parser.get_node(current_node_id)
            if not node:
                continue

            node_type = node.get("type", "controlNode")
            data = node.get("data", {})
            label = data.get("label", current_node_id)
            control_id = data.get("controlId", "")
            control = data.get("control", {})
            runtime_config = control.get("runtimeConfig", {})
            engine = runtime_config.get("engine", control_id)

            # -------------------------------------------------------------
            # DYNAMIC INCOMING PORT DATA RESOLUTION
            # -------------------------------------------------------------
            incoming_edges = parser.get_incoming_edges(current_node_id)
            current_inputs: Dict[str, Any] = {}

            for edge in incoming_edges:
                src_node_id = edge.get("source")
                src_handle = edge.get("sourceHandle") or "out_pass"
                target_handle = edge.get("targetHandle") or "in_payload"

                src_output = ctx.node_outputs.get(src_node_id, {})
                if isinstance(src_output, dict) and src_handle in src_output:
                    port_val = src_output[src_handle]
                elif isinstance(src_output, dict) and "data" in src_output:
                    port_val = src_output["data"]
                else:
                    port_val = src_output

                current_inputs[target_handle] = port_val

            ctx.current_inputs = current_inputs

            span_start = time.time()

            # Process Node execution
            if node_type == "prompt" or control_id == "ingestion_node":
                # Entry point node — passes prompt through
                status = "passed"
                action_taken = "Pass"
                out_payload = ctx.prompt_object
                ctx.set_output("out_prompt_obj", out_payload)
                ctx.set_output("out_pass", out_payload)
            elif node_type == "terminal" or engine in ["allow_llm", "litellm_gateway"]:
                target_model = ctx.metadata.get("selected_model", "gpt-4o")
                prompt_to_send = ctx.get_input_prompt("in_term_pass") or ctx.prompt_object.get("prompt", "")
                llm_response = await self.llm_gateway.invoke_chat_completion(
                    model=target_model,
                    messages=[{"role": "user", "content": prompt_to_send}]
                )
                ctx.metadata["llm_response"] = llm_response
                ctx.final_output = llm_response
                status = "passed"
                action_taken = "Allow"
                ctx.set_output("out_response", llm_response)
            else:
                # Security / Governance / Control Node dispatch
                self._dispatch_node(ctx, node, engine)
                status = "passed" if not ctx.is_blocked and not ctx.is_mutated else ("blocked" if ctx.is_blocked else "mutated")
                action_taken = "Halt" if ctx.is_blocked else ("Redact" if ctx.is_mutated else "Allow")

                # Populate standard output ports if not explicitly set by control function
                cur_output = ctx.sanitized_prompt_object or ctx.prompt_object
                ctx.set_output("out_pass", cur_output)
                ctx.set_output("out_sanitized", cur_output)
                ctx.set_output("out_checked", cur_output)
                ctx.set_output("out_scanned", cur_output)
                if ctx.is_blocked:
                    ctx.set_output("out_toxic", {"status": "blocked", "flags": list(ctx.taint_flags)})
                    ctx.set_output("out_block", {"status": "blocked", "reason": ctx.trigger_reason})

            duration_ms = round((time.time() - span_start) * 1000, 2)
            span_data = {
                "span_id": f"span_{current_node_id}_{int(time.time()*1000)}",
                "node_id": current_node_id,
                "node_label": label,
                "engine": engine,
                "status": status,
                "action_taken": action_taken,
                "duration_ms": duration_ms,
                "metadata": dict(ctx.metadata),
                "inputs_received": list(current_inputs.keys())
            }
            trace_spans.append(span_data)
            ctx.set_output("span", span_data)

            # Check if block/halt rule triggered
            if ctx.is_blocked:
                logger.info(f"Pipeline {pipeline.id} execution halted at node {current_node_id}.")
                break

            # Resolve next target node(s)
            next_handle = ctx.metadata.get("next_handle_id")
            next_node_ids = parser.get_next_node_ids(current_node_id, handle_id=next_handle)
            for next_id in next_node_ids:
                if next_id not in visited:
                    queue.append(next_id)

        # Synthesize execution result
        action_taken = "Halt" if ctx.is_blocked else ("Redact" if ctx.is_mutated else "Allow")
        final_status = "blocked" if ctx.is_blocked else ("mutated" if ctx.is_mutated else "passed")

        return {
            "pipeline_id": pipeline.id,
            "status": final_status,
            "action_taken": action_taken,
            "sanitized_prompt_object": ctx.sanitized_prompt_object or ctx.prompt_object,
            "filtered_tool_manifest": ctx.tool_manifest,
            "metadata": ctx.metadata,
            "trace_spans": trace_spans,
            "execution_duration_ms": sum(s["duration_ms"] for s in trace_spans)
        }

    def _dispatch_node(self, ctx: PipelineContext, node: Dict[str, Any], engine: str):
        """
        Looks up control function execution logic from O(1) ControlRegistry.
        """
        data = node.get("data", {})
        config_values = data.get("configValues", {})
        control_fn = ControlRegistry.get_control(engine)

        if control_fn:
            control_fn(ctx, config_values)
        else:
            logger.warning(f"No control engine handler registered for '{engine}'. Defaulting to pass-through.")
