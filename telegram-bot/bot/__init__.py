"""
Инициализация бота и диспетчера
Логирование всех действий
"""
import logging
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.methods import DeleteWebhook

from bot.config import settings
from bot.middlewares.logging import LoggingMiddleware

logger = logging.getLogger(__name__)


# Инициализация бота
bot = Bot(
    token=settings.BOT_TOKEN,
    default=DefaultBotProperties(
        parse_mode=ParseMode.HTML,
        link_preview_is_disabled=True
    )
)


# Инициализация диспетчера
dp = Dispatcher(storage=MemoryStorage())

# Регистрация middleware для логирования
dp.update.middleware(LoggingMiddleware())


# Функция для очистки webhook при запуске
async def clear_webhook():
    """Очистка webhook при запуске в polling режиме"""
    try:
        await bot(DeleteWebhook(drop_pending_updates=True))
        logger.info("✅ Webhook очищен")
    except Exception as e:
        logger.error(f"❌ Ошибка очистки webhook: {e}")
