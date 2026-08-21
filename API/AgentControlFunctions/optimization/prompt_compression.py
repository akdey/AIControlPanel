"""
LLMLingua2 Prompt Compression Control Function (Phase 1)
-------------------------------------------------------
Control ID: ctrl_prompt_compression
Engine Key: prompt_compression

How This Control Works:
1. Intercepts prompt text from `ctx.get_input_prompt("in_prompt")` or `ctx.prompt_object["prompt"]`.
2. Inspects `rate` (target fraction of tokens to preserve, default 0.5) and `force_reserve_keywords`.
3. Passes the prompt directly to LLMLingua2 `PromptCompressor(model_name="microsoft/llmlingua-2-bert-base-multilingual-cased", use_llmlingua2=True)`.
4. Updates `ctx.sanitized_prompt_object["prompt"]` with the compressed text and records `compression_ratio` in metadata.
5. Emits compressed prompt to output handle `out_compressed`.
"""

import logging
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext
from llmlingua import PromptCompressor

logger = logging.getLogger(__name__)

# Initialize LLMLingua2 PromptCompressor model
compressor = PromptCompressor(
    model_name="microsoft/llmlingua-2-bert-base-multilingual-cased",
    use_llmlingua2=True
)

@register_control(["prompt_compression", "compress_prompt_llmlingua", "ctrl_prompt_compression"])
def execute_prompt_compression(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Compresses prompt text using LLMLingua2 to reduce token cost and latency.
    Inputs:
      - in_prompt: Input prompt object or prompt string
    Config Properties:
      - rate: Compression rate target (float, e.g. 0.5)
      - force_reserve_keywords: Comma-separated list of mandatory words
    Outputs:
      - out_compressed: Compressed prompt payload
    """
    input_text = ctx.get_input_prompt("in_prompt") or ctx.prompt_object.get("prompt", "")
    if not input_text or len(input_text.strip()) < 50:
        ctx.set_output("out_compressed", ctx.prompt_object)
        return ctx

    target_rate = float(node_config.get("rate", 0.5))
    reserved_raw = str(node_config.get("force_reserve_keywords", "MUST, NEVER, RETURN, JSON, SYSTEM"))
    reserved_words = [w.strip() for w in reserved_raw.split(",") if w.strip()]

    results = compressor.compress_prompt(
        input_text,
        rate=target_rate,
        force_tokens=reserved_words,
        drop_consecutive=True
    )
    compressed_text = results.get("compressed_prompt", input_text)
    origin_tokens = results.get("origin_tokens", len(input_text.split()))
    compressed_tokens = results.get("compressed_tokens", len(compressed_text.split()))
    ratio = results.get("ratio", f"{compressed_tokens}/{origin_tokens}")

    ctx.metadata["prompt_compression"] = {
        "original_tokens": origin_tokens,
        "compressed_tokens": compressed_tokens,
        "ratio": ratio,
        "engine": "LLMLingua2"
    }

    # Update context
    ctx.sanitized_prompt_object["prompt"] = compressed_text
    ctx.set_output("out_compressed", ctx.sanitized_prompt_object)
    ctx.action_taken = "Mutate"
    ctx.execution_status = "mutated"

    return ctx
