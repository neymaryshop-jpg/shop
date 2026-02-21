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
from aiogram.types import CallbackQuery, Message

from bot.config import settings

logger = logging.getLogger(__name__)


# Middleware для логирования
async def log_callback_query(call: CallbackQuery):
    """Логирование всех callback query"""
    username = call.from_user.username or f"id{call.from_user.id}"
    logger.info(f"🔘 CALLBACK User:{call.from_user.id} (@{username}) Data:{call.data}")


async def log_message(message: Message):
    """Логирование всех сообщений"""
    if message.text:
        username = message.from_user.username or f"id{message.from_user.id}"
        logger.info(f"💬 MESSAGE User:{message.from_user.id} (@{username}) Text:{message.text[:100]}")


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
dp.callback_query.middleware(log_callback_query)
dp.message.middleware(log_message)


# Функция для очистки webhook при запуске
async def clear_webhook():
    """Очистка webhook при запуске в polling режиме"""
    try:
        await bot(DeleteWebhook(drop_pending_updates=True))
        logger.info("✅ Webhook очищен")
    except Exception as e:
        logger.error(f"❌ Ошибка очистки webhook: {e}")
