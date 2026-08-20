import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class BaseCacheAdapter:
    def get(self, key: str) -> Optional[str]:
        raise NotImplementedError
    def set(self, key: str, value: str, ttl: int = 3600):
        raise NotImplementedError

class RedisCacheAdapter(BaseCacheAdapter):
    """Production Redis / RedisVL Cache Adapter."""
    def __init__(self, redis_url: str):
        import redis
        self.client = redis.Redis.from_url(redis_url, decode_responses=True)

    def get(self, key: str) -> Optional[str]:
        try:
            return self.client.get(key)
        except Exception as e:
            logger.warning(f"Redis get failed: {e}")
            return None

    def set(self, key: str, value: str, ttl: int = 3600):
        try:
            self.client.setex(key, ttl, value)
        except Exception as e:
            logger.warning(f"Redis set failed: {e}")

class InMemoryCacheAdapter(BaseCacheAdapter):
    """In-Memory Cache Adapter fallback."""
    def __init__(self):
        self._store = {}

    def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    def set(self, key: str, value: str, ttl: int = 3600):
        self._store[key] = value

_cache_instance: Optional[BaseCacheAdapter] = None

def get_cache_provider() -> BaseCacheAdapter:
    global _cache_instance
    if _cache_instance is not None:
        return _cache_instance

    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            _cache_instance = RedisCacheAdapter(redis_url)
            logger.info(f"Initialized Redis Cache Adapter connected to {redis_url}")
            return _cache_instance
        except Exception as e:
            logger.warning(f"Failed to connect Redis ({e}). Using In-Memory Cache Adapter.")

    _cache_instance = InMemoryCacheAdapter()
    return _cache_instance
