"""
Shell Command AST Inspector Control Function (Phase 2 Spec - Inactive)
----------------------------------------------------------------------
Control ID: ctrl_bash_cmd_sandbox
Engine Key: bash_cmd_sandbox

How This Control Works:
1. Intercepts bash execution strings from tool call parameters via `ctx.get_input_prompt("in_cmd")`.
2. Parses shell commands into AST nodes using `bashlex` OSS library (`bashlex.parse`).
3. Traverses AST nodes to detect forbidden binary commands (`rm`, `sudo`, `mkfs`, `dd`, `shutdown`, `reboot`, `chmod`, `chown`).
4. If prohibited command or reverse shell pattern (`/dev/tcp`, `| bash`) detected:
   - Sets `ctx.execution_status = "blocked"` and `ctx.action_taken = "Halt"`.
   - Routes payload to output handle `out_block`.
5. If clean, routes payload to output handle `out_pass`.
"""

# Inactive control definition - Execution logic disabled for Phase 2.
