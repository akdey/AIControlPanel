# Enterprise Agent Control Panel: Master Controls Specification

## 1. System Architecture & Context Interception

The **Enterprise AI Control Panel** is an **Autonomous Agent Harness and LLM Gateway Proxy**. It sits between API Gateways (`LiteLLM`, `Portkey`, `Kong AI Gateway`, `LangChain/LangGraph`, `OpenAI SDKs`, and `Model Context Protocol (MCP)` hosts) via `pre_call_hook` and `post_call_hook`.

```
                                      AI CONTROL PANEL / AGENT HARNESS
                                 ┌────────────────────────────────────────┐
┌────────────────┐  pre_call     │  ┌───────────┐     ┌────────────────┐  │   Sanitized Payload   ┌──────────────┐
│  LLM GATEWAY   │ ────────────> │  │ Ingestion │ ──> │ Visual Control │ ─┼─────────────────────> │ Target LLMs  │
│ (LiteLLM, etc.)│ <──────────── │  │  Payload  │     │ Pipeline (DAG) │  │  (Mutated / Allowed)  │(OpenAI, Anth,│
└────────────────┘ Direct Resp   │  └───────────┘     └────────────────┘  │                       │ Gemini, etc.)│
                    (Halt/Cache) │                                        │                       └──────────────┘
                                 └────────────────────────────────────────┘
```

---

## 2. Implementation Roadmap & Phases

Controls are structured across **3 Phased Rollout Tiers** based on operational urgency, security severity, and deployment complexity:

- **Phase 1: Core Foundations & Immediate Safety** (Input/Output Guardrails, AST SQL Inspector, LLMLingua2 Compression, Tool Manifest RBAC, Basic Routing, FinOps)
- **Phase 2: Advanced Tooling & Agent Governance** (Shell AST Syntax Guardrails, SSRF Egress, Parameter Schema Enforcement, Context Anchor)
- **Phase 3: Enterprise Compliance, MicroVM Sandboxing & HITL** (Firecracker MicroVM, Wasm, Async Approval, Cryptographic Signer)

---

## 3. Phase 1: Core Foundations & Immediate Safety (Implemented & Active)

These controls handle baseline security, privacy, prompt injection, tool RBAC, AST SQL inspection, LLMLingua2 prompt compression, routing, and cost protection.

| Control ID | JSON Spec File | Name | Severity | OSS Engine | Action on Trigger |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `ctrl_pii_masking` | `ctrl_pii_masking.json` | **Presidio PII Redactor** | `HIGH` | `presidio-analyzer`, `presidio-anonymizer` | Redact / Mask |
| `ctrl_secret_scanner` | `ctrl_secret_scanner.json` | **Secrets & Credential Scanner** | `CRITICAL` | `detect-secrets` + Shannon Entropy | Redact / Halt |
| `ctrl_phi_redactor` | `ctrl_phi_redactor.json` | **HIPAA PHI Sanitizer** | `HIGH` | `presidio-analyzer` (HIPAA Recognizer) | Redact |
| `ctrl_prompt_injection` | `ctrl_prompt_injection.json` | **Prompt Injection Shield** | `CRITICAL` | `transformers` (`deepset/deberta-v3...`) | Halt (`out_block`) |
| `ctrl_toxicity_checker` | `ctrl_toxicity_checker.json` | **Multi-Axis Toxicity Moderation** | `HIGH` | `detoxify` (6-axis PyTorch RoBERTa) | Halt (`out_toxic`) |
| `ctrl_malicious_url` | `ctrl_malicious_url.json` | **Malicious Domain & Phishing** | `HIGH` | `tldextract` + `urllib.parse` | Redact / Halt |
| `ctrl_tool_sanitizer` | `ctrl_tool_sanitizer.json` | **Tool Manifest RBAC Filter** | `HIGH` | `jsonschema` / Dict Filter | Mutate `tools` |
| `ctrl_sql_guardrail` | `ctrl_sql_guardrail.json` | **SQL Query AST Inspector** | `CRITICAL` | `sqlglot` AST Parser | Halt (`out_block`) |
| `ctrl_prompt_compression`| `ctrl_prompt_compression.json`| **Prompt Compression (LLMLingua2)**| `MEDIUM` | `llmlingua` (Microsoft OSS) | Mutate `prompt` |
| `ctrl_model_router` | `ctrl_model_router.json` | **Complexity Model Cascade** | `LOW` | `tiktoken` + Length/Intent Heuristics | Mutate `model` |
| `ctrl_semantic_cache` | `ctrl_semantic_cache.json` | **Vector Semantic Cache** | `MEDIUM` | `faiss-cpu` / `sentence-transformers` | Short-Circuit Return |
| `ctrl_context_truncator`| `ctrl_context_truncator.json` | **Context Window Auto-Compactor** | `MEDIUM` | `tiktoken` Context Compactor | Mutate `messages` |
| `ctrl_rate_limiter` | `ctrl_rate_limiter.json` | **Token Bucket Rate Limiter** | `HIGH` | `redis` / `aioredis` Token Bucket | Halt (HTTP 429) |
| `ctrl_budget_enforcer` | `ctrl_budget_enforcer.json` | **Cost & Spend Ceiling** | `HIGH` | `sqlalchemy` Balance Accumulator | Halt (Budget Cap) |
| `ctrl_decision_gate` | `ctrl_decision_gate.json` | **Dynamic Boolean Condition Gate** | `MEDIUM` | Python Context Evaluator | Route Branch |
| `ctrl_generic_rule_eval` | `ctrl_generic_rule_evaluator.json` | **Sandboxed Expression Evaluator** | `MEDIUM` | `simpleeval` Python Engine | Route Handle |

---

## 4. Phase 2: Advanced Tooling & Agent Governance (Inactive Spec)

These controls protect multi-step autonomous agents, validate shell execution parameters via AST, compress context, and prevent loop recursion.

| Control ID | JSON Spec File | Name | Severity | OSS Engine | Action on Trigger |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `ctrl_bash_cmd_sandbox` | `ctrl_bash_cmd_sandbox.json` | **Shell Command AST Inspector** | `CRITICAL` | `bashlex` AST Parser | Halt (`out_block`) |
| `ctrl_ssrf_egress_guard` | `ctrl_ssrf_egress_guard.json` | **SSRF & Network Egress Guard** | `CRITICAL` | `ipaddress` + `urllib.parse` | Halt (`out_block`) |
| `ctrl_tool_param_schema`| `ctrl_tool_param_schema.json`| **Tool Parameter Schema Validator**| `HIGH` | `fastjsonschema` | Mutate / Halt |
| `ctrl_indirect_injection`| `ctrl_indirect_injection.json`| **Indirect RAG Injection Shield** | `HIGH` | `beautifulsoup4` + Regex Quarantine | Mutate / Quarantine |
| `ctrl_hidden_unicode` | `ctrl_hidden_unicode.json` | **Invisible Unicode Stripper** | `MEDIUM` | `unicodedata` NFKC (Python StdLib) | Mutate |
| `ctrl_system_prompt_anchor`|`ctrl_system_prompt_anchor.json`| **System Prompt Anchor Re-Injector**| `MEDIUM` | `hashlib` MD5 Checker | Re-inject System Anchor |
| `ctrl_recursion_limiter` | `ctrl_recursion_limiter.json` | **Agent Recursion & Step Limiter** | `HIGH` | Python Counter (`metadata.step_count`) | Halt (Loop Exceeded) |
| `ctrl_json_schema_enforcer`|`ctrl_json_schema_enforcer.json`| **Structured Output Schema Repair**| `MEDIUM` | `json-repair` + `fastjsonschema` | Mutate / Repair JSON |

---

## 5. Phase 3: Enterprise Compliance, MicroVM Sandboxing & HITL (Inactive Spec)

These controls provide isolated microVM sandboxing, asynchronous human signoff, NLI hallucination checking, and cryptographic audit signing.

| Control ID | JSON Spec File | Name | Severity | OSS Engine | Action on Trigger |
| :--- | :--- | :--- | :---: | :--- | :---: |
| `ctrl_blast_radius` | `ctrl_blast_radius.json` | **Destructive Action Risk Classifier**| `HIGH` | Action Verb Classifier Matrix | Route to HITL |
| `ctrl_mcp_provenance` | `ctrl_mcp_provenance.json` | **MCP Skill Signature Verifier** | `CRITICAL` | `hmac` + `hashlib` SHA256 | Halt |
| `ctrl_rag_groundedness` | `ctrl_rag_groundedness.json` | **Hallucination & Faithfulness** | `HIGH` | `sentence-transformers` NLI DeBERTa | Flag / Add Warning |
| `ctrl_code_vuln_scanner` | `ctrl_code_vuln_scanner.json` | **Generated Code AST Inspector** | `CRITICAL` | `bandit` / `ast` (Python StdLib) | Halt / Flag |
| `ctrl_firecracker_microvm`| `ctrl_firecracker_microvm.json`| **Firecracker MicroVM Sandbox** | `CRITICAL` | `docker` Python SDK / Firecracker API | Isolated Run |
| `ctrl_wasm_sandbox` | `ctrl_wasm_sandbox.json` | **Wasm Isolated Runtime** | `HIGH` | `wasmtime` (Python Wasmtime OSS) | Isolated Run |
| `ctrl_hitl_approval` | `ctrl_hitl_approval.json` | **Async Human Approval Gate** | `HIGH` | `fastapi` Webhook + State Waiter | Pause & Await Signoff |
| `ctrl_audit_trail_signer`| `ctrl_audit_trail_signer.json`| **Cryptographic Audit Signer** | `MEDIUM` | `hmac` + `hashlib` (Python StdLib) | Sign Span Trace |
| `ctrl_circuit_breaker` | `ctrl_circuit_breaker.json` | **Provider Health Circuit Breaker** | `HIGH` | `pybreaker` | Mutate Provider |
| `ctrl_opentelemetry_exporter`|`ctrl_opentelemetry_exporter.json`| **OpenTelemetry Span Exporter** | `LOW` | `opentelemetry-api`, `opentelemetry-sdk` | Emit OTEL Span |

---

## 6. Implementation Deep-Dives: Implemented Phase 1 Control Algorithms

Here are exact, concrete Python implementations for key Phase 1 controls:

### A. SQL Query AST Inspector (`ctrl_sql_guardrail`)
Uses `sqlglot` to parse generated SQL queries into AST nodes, blocking schema mutation and data deletion statements:

```python
import sqlglot
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

@register_control(["sql_guardrail", "check_sql_ast", "ctrl_sql_guardrail"])
def execute_sql_guardrail(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    sql_text = ctx.get_input_prompt("in_sql") or ctx.prompt_object.get("prompt", "")
    if not sql_text or not isinstance(sql_text, str):
        ctx.set_output("out_pass", ctx.prompt_object)
        return ctx

    blocked_raw = str(node_config.get("blocked_statements", "DROP, DELETE, ALTER, TRUNCATE, INSERT, UPDATE"))
    blocked_types = {t.strip().upper() for t in blocked_raw.split(",") if t.strip()}
    allow_multi = bool(node_config.get("allow_multi_statements", False))

    statements = sqlglot.parse(sql_text)
    if len(statements) > 1 and not allow_multi:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.trigger_reason = f"Multi-statement SQL query detected ({len(statements)} statements)."
        ctx.set_output("out_block", ctx.prompt_object)
        return ctx

    for stmt in statements:
        if stmt is None:
            continue
        stmt_key = (getattr(stmt, "key", "") or "").upper()
        if stmt_key in blocked_types:
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"Forbidden SQL AST Statement '{stmt_key}' detected."
            ctx.set_output("out_block", ctx.prompt_object)
            return ctx

    ctx.set_output("out_pass", ctx.prompt_object)
    return ctx
```

---

### B. Prompt Compression Engine (`ctrl_prompt_compression`)
Uses `llmlingua` (LLMLingua2) to prune low-information tokens from prompts:

```python
from llmlingua import PromptCompressor
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

compressor = PromptCompressor(
    model_name="microsoft/llmlingua-2-bert-base-multilingual-cased",
    use_llmlingua2=True
)

@register_control(["prompt_compression", "compress_prompt_llmlingua"])
def execute_prompt_compression(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    input_text = ctx.get_input_prompt("in_prompt") or ctx.prompt_object.get("prompt", "")
    target_rate = float(node_config.get("rate", 0.5))

    results = compressor.compress_prompt(input_text, rate=target_rate, drop_consecutive=True)
    compressed_text = results.get("compressed_prompt", input_text)

    ctx.sanitized_prompt_object["prompt"] = compressed_text
    ctx.set_output("out_compressed", ctx.sanitized_prompt_object)
    return ctx
```
