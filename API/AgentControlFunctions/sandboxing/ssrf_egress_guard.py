"""
SSRF & Network Egress Resolver Control Function (Phase 2 Spec - Inactive)
---------------------------------------------------------------------
Control ID: ctrl_ssrf_egress_guard
Engine Key: ssrf_egress_guard

How This Control Works:
1. Intercepts target URL parameters from tool calls via `ctx.get_input_prompt("in_url")` or prompt text.
2. Parses the hostname using standard library `urllib.parse`.
3. Resolves DNS hostnames to IP addresses using `socket.gethostbyname()`.
4. Evaluates the target IP against restricted CIDR blocks using standard library `ipaddress`:
   - Loopback (`127.0.0.0/8`, `::1/128`)
   - Private IPv4 Networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - AWS Metadata Service (`169.254.169.254/32`)
5. If target IP falls inside a restricted CIDR:
   - Sets `ctx.execution_status = "blocked"` and `ctx.action_taken = "Halt"`.
   - Routes payload to output handle `out_block`.
6. If clean, routes payload to output handle `out_pass`.
"""

# Inactive control definition - Execution logic disabled for Phase 2.
