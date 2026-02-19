"""
NeymaryShop - Telegram Бот (Донат в игры)
3 этапа: Оплата → Почта → Код
"""
import asyncio
import logging
import os
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Импорт компонентов бота
from bot import dp, bot
from bot.services.database import db
from bot.services.redis_cache import redis

# Логирование регистрации
logger.info(f"📦 Registering routers...")

# Импорт и регистрация хэндлеров
from bot.handlers.start import router as start_router
from bot.handlers.profile import router as profile_router

logger.info(f"  - start_router: {start_router}")
logger.info(f"  - profile_router: {profile_router}")

dp.include_router(start_router)
dp.include_router(profile_router)

logger.info(f"✅ Routers registered!")


async def on_startup():
    """Действия при запуске бота"""
    logger.info("🤖 Запуск GameDonat Bot...")
    logger.info("🚀 Бот готов к работе!")


async def on_shutdown():
    """Действия при остановке бота"""
    logger.info("🛑 Остановка бота...")
    await bot.session.close()
    logger.info("❌ Сессия бота закрыта")


async def main():
    """Основная функция запуска"""
    # Инициализация БД и Redis
    logger.info("🔧 Инициализация сервисов...")
    await db.connect()
    await redis.connect()
    logger.info("✅ Сервисы инициализированы")

    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)

    logger.info("📡 Запуск polling...")
    await dp.start_polling(bot)


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Бот остановлен пользователем")
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}", exc_info=True)
