"""
Сервис для работы с Redis (кэширование и сессии)
"""
import logging
import json
from typing import Optional, Any
from redis.asyncio import Redis as AsyncRedis

from bot.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    """Сервис кэширования на Redis"""
    
    def __init__(self):
        self._redis: Optional[AsyncRedis] = None
    
    async def connect(self):
        """Подключение к Redis"""
        try:
            self._redis = AsyncRedis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self._redis.ping()
            logger.info("✅ Redis подключен")
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к Redis: {e}")
            self._redis = None
    
    async def disconnect(self):
        """Отключение от Redis"""
        if self._redis:
            await self._redis.close()
    
    async def get_client(self) -> AsyncRedis:
        """Получение клиента Redis"""
        if not self._redis:
            await self.connect()
        return self._redis
    
    async def get(self, key: str) -> Optional[Any]:
        """Получение значения из кэша"""
        if not self._redis:
            return None
        try:
            value = await self._redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Ошибка получения из Redis: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 300):
        """Сохранение значения в кэш"""
        if not self._redis:
            return
        try:
            await self._redis.setex(key, ttl, json.dumps(value))
        except Exception as e:
            logger.error(f"Ошибка записи в Redis: {e}")
    
    async def delete(self, key: str):
        """Удаление значения из кэша"""
        if not self._redis:
            return
        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.error(f"Ошибка удаления из Redis: {e}")
    
    @staticmethod
    def products_key() -> str:
        return "cache:products:all"
    
    @staticmethod
    def product_key(product_id: int) -> str:
        return f"cache:products:{product_id}"
    
    @staticmethod
    def categories_key() -> str:
        return "cache:categories:all"

    @staticmethod
    def category_key(category_id: int) -> str:
        return f"cache:categories:{category_id}"


# Глобальный экземпляр
redis = RedisCache()
