"""
Конфигурация бота
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Настройки бота"""
    
    # Telegram
    BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
    
    # База данных
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://neymary:neymary123@localhost:5432/neymaryshop')
    
    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # Backend API
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3001')
    
    # Администраторы (staff)
    ADMIN_IDS = [int(x.strip()) for x in os.getenv('ADMIN_IDS', '1661627681').split(',') if x.strip()]
    
    # Реферальная система
    REFERRAL_MIN_CUSTOM_LENGTH = 4
    REFERRAL_MAX_CUSTOM_LENGTH = 20
    REFERRAL_TIER_1 = {'min': 0, 'max': 5, 'percent': 2}
    REFERRAL_TIER_2 = {'min': 5, 'max': 9, 'percent': 3}
    REFERRAL_TIER_3 = {'min': 10, 'max': float('inf'), 'percent': 5}
    REFERRAL_CUSTOM_COST = 5
    
    # Пагинация
    PAGE_SIZE = 10
    
    # Кэширование
    CACHE_TTL_PRODUCTS = 300
    CACHE_TTL_CATEGORIES = 600


settings = Settings()
