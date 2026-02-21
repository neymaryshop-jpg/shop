"""
Middleware для логирования действий пользователей
aiogram 3.x совместимый формат
"""
import logging
from typing import Any, Awaitable, Callable, Dict
from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, Update

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseMiddleware):
    """Middleware для логирования всех событий"""

    async def __call__(
        self,
        handler: Callable[[Update, Dict[str, Any]], Awaitable[Any]],
        event: Update,
        data: Dict[str, Any]
    ) -> Any:
        """Логирование событий"""
        # Логирование callback query
        if isinstance(event, CallbackQuery):
            username = event.from_user.username or f"id{event.from_user.id}"
            logger.info(
                f"🔘 CALLBACK | User:{event.from_user.id} (@{username}) | "
                f"Data:{event.data}"
            )
        
        # Логирование сообщений
        if isinstance(event, Message) and event.text:
            username = event.from_user.username or f"id{event.from_user.id}"
            text_preview = event.text[:100].replace('\n', ' ')
            logger.info(
                f"💬 MESSAGE | User:{event.from_user.id} (@{username}) | "
                f"Text:{text_preview}"
            )
        
        return await handler(event, data)
