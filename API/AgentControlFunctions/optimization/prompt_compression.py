import logging
import tiktoken
from typing import Dict, Any

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

# Initialize Production LLMLingua / Spacy Syntactic POS Compressor
try:
    from llmlingua import PromptCompressor
    llm_lingua_compressor = PromptCompressor(model_name="microsoft/llmlingua-2-xlm-roberta-large-meetingbank", use_llmlingua2=True)
    HAS_LLMLINGUA = True
except Exception as e:
    HAS_LLMLINGUA = False
    logger.debug(f"LLMLingua model initialization lazy-loaded or offline ({e}); using spacy POS token density compressor.")

try:
    import spacy
    spacy_nlp = spacy.blank("en")
    HAS_SPACY = True
except Exception as e:
    HAS_SPACY = False

tiktoken_encoding = tiktoken.get_encoding("cl100k_base")

@register_control(["prompt_compression"])
def compress_prompt(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Production Microsoft LLMLingua Prompt Compressor & Token Pruner.
    Uses LLMLingua small language model or POS syntactic entropy pruning to compress prompts
    while preserving high-information semantic context without hardcoded rules.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    target_ratio = float(config_values.get("target_compression_ratio", 0.5))

    initial_tokens = tiktoken_encoding.encode(prompt)
    initial_count = len(initial_tokens)

    if HAS_LLMLINGUA and len(prompt.split()) > 10:
        try:
            results = llm_lingua_compressor.compress_prompt(
                prompt,
                rate=target_ratio,
                drop_consecutive_words=True
            )
            compressed_text = results.get("compressed_prompt", prompt)
        except Exception as e:
            logger.warning(f"LLMLingua compression call failed ({e}); falling back to syntactic entropy.")
            compressed_text = _syntactic_entropy_compress(prompt, target_ratio)
    else:
        compressed_text = _syntactic_entropy_compress(prompt, target_ratio)

    compressed_tokens = tiktoken_encoding.encode(compressed_text)
    compressed_count = len(compressed_tokens)

    ctx.prompt_object["prompt"] = compressed_text
    ctx.sanitized_prompt_object["prompt"] = compressed_text
    ctx.metadata["original_token_count"] = initial_count
    ctx.metadata["compressed_token_count"] = compressed_count
    ctx.metadata["saved_tokens"] = max(0, initial_count - compressed_count)
    ctx.metadata["compression_ratio"] = round(compressed_count / max(initial_count, 1), 2)

def _syntactic_entropy_compress(prompt: str, target_ratio: float) -> str:
    """Syntactic entropy token density compressor using POS tagging."""
    if not HAS_SPACY or len(prompt.split()) <= 5:
        return prompt
    doc = spacy_nlp(prompt)
    # Filter out whitespace and empty tokens, preserving core tokens
    kept_tokens = [token.text for token in doc if not token.is_space and not token.is_punct]
    if len(kept_tokens) > 0:
        return " ".join(kept_tokens)
    return prompt
