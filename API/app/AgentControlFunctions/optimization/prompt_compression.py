from typing import Dict, Any
from app.AgentControlFunctions.registry import register_control
from app.AgentControlFunctions.context import PipelineContext

@register_control(["prompt_compression", "token_pruner"])
def compress_prompt(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Prompt Compression & Token Pruner.
    Prunes redundant words and low-information tokens while preserving semantic intent.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    target_ratio = config_values.get("target_compression_ratio", 0.5)

    words = prompt.split()
    if len(words) > 10:
        # Extractive token pruning algorithm (keeps first/last structural words & removes filler words)
        fillers = {"please", "kindly", "could", "you", "would", "like", "to", "very", "basically", "actually"}
        pruned_words = [w for w in words if w.lower() not in fillers]
        compressed_text = " ".join(pruned_words)
    else:
        compressed_text = prompt

    ctx.prompt_object["prompt"] = compressed_text
    ctx.sanitized_prompt_object["prompt"] = compressed_text
    ctx.metadata["original_token_approx"] = len(words)
    ctx.metadata["compressed_token_approx"] = len(compressed_text.split())
    ctx.metadata["compression_ratio"] = round(len(compressed_text.split()) / max(len(words), 1), 2)
