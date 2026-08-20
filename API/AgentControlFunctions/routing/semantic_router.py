import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

logger = logging.getLogger(__name__)

# Initialize SentenceTransformers Vector Similarity Engine for Semantic Routing
try:
    from sentence_transformers import SentenceTransformer, util
    semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
    HAS_SENTENCE_TRANSFORMERS = True
except Exception as e:
    HAS_SENTENCE_TRANSFORMERS = False
    logger.debug(f"SentenceTransformers lazy-loaded or offline ({e})")

# Target Route Canonical Intent Clusters
ROUTE_INTENTS = {
    "slm_route": ["quick answer", "simple calculation", "what is time", "hello support", "status check"],
    "fallback_route": ["system error", "unexpected failure", "retry connection", "out of bounds"],
    "llm_route": ["complex reasoning task", "write comprehensive code", "analyze dataset", "multi-step planning"]
}

@register_control(["semantic_router"])
def execute_semantic_router(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Production Semantic Router using SentenceTransformers Vector Cosine Similarity.
    Embeds input prompts into dense vector space and routes payloads to optimal handles based on semantic intent.
    """
    start_time = time.time()
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", "")).strip()

    best_branch = "llm_route"
    max_similarity = -1.0

    if HAS_SENTENCE_TRANSFORMERS and text:
        try:
            prompt_embedding = semantic_model.encode(text, convert_to_tensor=True)
            for branch, sample_intents in ROUTE_INTENTS.items():
                intent_embeddings = semantic_model.encode(sample_intents, convert_to_tensor=True)
                cosine_scores = util.cos_sim(prompt_embedding, intent_embeddings)
                best_score = float(cosine_scores.max())
                if best_score > max_similarity:
                    max_similarity = best_score
                    best_branch = branch
        except Exception as e:
            logger.warning(f"SentenceTransformers semantic routing failed ({e})")

    ctx.routing_decision = best_branch
    ctx.metadata["next_handle_id"] = best_branch
    ctx.metadata["vector_similarity_score"] = round(max_similarity, 3)

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Semantic Router"),
        node_type="router",
        start_time=start_time,
        end_time=end_time,
        status="passed",
        input_payload={"prompt": text[:100]},
        output_payload={"decisionBranch": best_branch, "similarityScore": round(max_similarity, 3)}
    )

    return ctx
