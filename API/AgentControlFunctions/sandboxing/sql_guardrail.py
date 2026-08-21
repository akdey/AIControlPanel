"""
SQL Query AST Inspector Control Function (Phase 1)
-------------------------------------------------
Control ID: ctrl_sql_guardrail
Engine Key: sql_guardrail

How This Control Works:
1. When an agent generates a database SQL query or passes SQL in a tool argument, this node intercepts the SQL string.
2. It parses the SQL text into an Abstract Syntax Tree (AST) using `sqlglot` (an open-source SQL parser and transpiler).
3. It checks for forbidden statement types defined in `node_config["blocked_statements"]` by inspecting the AST statement key (`stmt.key.upper()`):
   - `DROP`
   - `DELETE`
   - `ALTER`
   - `TRUNCATE`
   - `INSERT`
   - `UPDATE`
4. It also checks for multi-statement queries (separated by semicolons `;`), which are a primary SQL injection vector.
5. If forbidden AST nodes or multi-statements are detected:
   - The execution is halted immediately (`ctx.execution_status = "blocked"`, `ctx.action_taken = "Halt"`).
   - The payload is routed to output handle `out_block`.
6. If the SQL query passes AST inspection, it is routed to output handle `out_pass`.
"""

import logging
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

try:
    import sqlglot
    HAS_SQLGLOT = True
except ImportError:
    HAS_SQLGLOT = False
    sqlglot = None

@register_control(["sql_guardrail", "check_sql_ast", "ctrl_sql_guardrail"])
def execute_sql_guardrail(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Parses SQL string into AST using sqlglot and blocks forbidden statement types.
    Inputs:
      - in_sql: Input SQL text or prompt object containing SQL query
    Config Properties:
      - blocked_statements: Comma-separated statement types to block (e.g. 'DROP, DELETE, ALTER')
      - allow_multi_statements: Boolean (false by default)
    Outputs:
      - out_pass: Safe SQL payload
      - out_block: Blocked query payload
    """
    sql_text = ctx.get_input_prompt("in_sql") or ctx.prompt_object.get("prompt", "")
    if not sql_text or not isinstance(sql_text, str):
        ctx.set_output("out_pass", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_pass"
        return ctx

    blocked_raw = str(node_config.get("blocked_statements", "DROP, DELETE, ALTER, TRUNCATE, INSERT, UPDATE"))
    blocked_types = {t.strip().upper() for t in blocked_raw.split(",") if t.strip()}
    allow_multi = bool(node_config.get("allow_multi_statements", False))

    if not HAS_SQLGLOT:
        logger.warning("[ctrl_sql_guardrail] sqlglot library not found; fallback keyword matching.")
        for stmt_type in blocked_types:
            if f" {stmt_type} " in f" {sql_text.upper()} ":
                ctx.execution_status = "blocked"
                ctx.action_taken = "Halt"
                ctx.trigger_reason = f"Forbidden SQL keyword '{stmt_type}' detected."
                ctx.set_output("out_block", ctx.prompt_object)
                ctx.metadata["next_handle_id"] = "out_block"
                return ctx
        ctx.set_output("out_pass", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_pass"
        return ctx

    # Perform full AST Parse using sqlglot
    try:
        statements = sqlglot.parse(sql_text)

        # 1. Multi-statement check
        if len(statements) > 1 and not allow_multi:
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"Multi-statement SQL query detected ({len(statements)} statements). Prohibited under security policy."
            ctx.set_output("out_block", ctx.prompt_object)
            ctx.metadata["next_handle_id"] = "out_block"
            logger.warning("[ctrl_sql_guardrail] Multi-statement query blocked.")
            return ctx

        # 2. Inspect AST statement keys
        for stmt in statements:
            if stmt is None:
                continue
            stmt_key = (getattr(stmt, "key", "") or "").upper()
            if stmt_key in blocked_types:
                ctx.execution_status = "blocked"
                ctx.action_taken = "Halt"
                ctx.trigger_reason = f"Forbidden SQL AST Statement '{stmt_key}' detected."
                ctx.set_output("out_block", ctx.prompt_object)
                ctx.metadata["next_handle_id"] = "out_block"
                logger.warning(f"[ctrl_sql_guardrail] Forbidden AST statement '{stmt_key}' blocked.")
                return ctx

    except Exception as e:
        logger.error(f"[ctrl_sql_guardrail] AST parse exception ({e}). Failing closed.")
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.trigger_reason = f"SQL AST parsing failure: {str(e)}"
        ctx.set_output("out_block", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_block"
        return ctx

    ctx.set_output("out_pass", ctx.prompt_object)
    ctx.metadata["next_handle_id"] = "out_pass"
    return ctx
