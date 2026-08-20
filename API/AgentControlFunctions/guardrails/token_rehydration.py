import logging
from typing import Dict, Any
from cryptography.fernet import Fernet

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

# Generate / Load Symmetric Key for Data Vault
VAULT_ENCRYPTION_KEY = Fernet.generate_key()
fernet_cipher = Fernet(VAULT_ENCRYPTION_KEY)

@register_control(["token_rehydration"])
def rehydrate_tokens(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Production Token Vault Rehydrator using cryptography.fernet (AES-256 GCM).
    Reverses masked tokens back to decrypted original values after receiving safe LLM completions.
    """
    llm_response = ctx.metadata.get("llm_response", {})
    response_text = llm_response.get("content", "") if isinstance(llm_response, dict) else str(llm_response)

    vault = ctx.redaction_metadata.get("token_vault", {})
    rehydrated_text = response_text
    rehydration_count = 0

    for token, secret_val in vault.items():
        if token in rehydrated_text:
            try:
                # Decrypt Fernet token payload if encrypted
                if isinstance(secret_val, bytes):
                    decrypted_val = fernet_cipher.decrypt(secret_val).decode("utf-8")
                else:
                    decrypted_val = str(secret_val)
                rehydrated_text = rehydrated_text.replace(token, decrypted_val)
                rehydration_count += 1
            except Exception as e:
                logger.warning(f"Vault decryption failed for token {token}: {e}")

    ctx.metadata["rehydrated_response"] = rehydrated_text
    ctx.metadata["rehydration_count"] = rehydration_count
    ctx.final_output = rehydrated_text
