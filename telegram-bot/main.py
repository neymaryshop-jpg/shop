import asyncio
import logging
import subprocess
import sys
import os
import json
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
import psycopg2
from psycopg2.extras import RealDictCursor

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Настройки БД
DB_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/neymaryshop')

# ID супер-админа (замените на ваш Telegram ID)
SUPER_ADMIN_ID = int(os.getenv('SUPER_ADMIN_TELEGRAM_ID', '0'))

class BotDatabase:
    def __init__(self):
        self.conn = None
    
    def connect(self):
        try:
            self.conn = psycopg2.connect(DB_URL)
            self.conn.autocommit = True
            return True
        except Exception as e:
            logger.error(f"Ошибка подключения к БД: {e}")
            return False
    
    def get_user_role(self, telegram_id: int) -> str:
        """Получить роль пользователя по Telegram ID"""
        if not self.conn:
            if not self.connect():
                return None
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT ar.role_name, ar.permissions 
                    FROM admin_roles ar
                    JOIN users u ON ar.user_id = u.id
                    WHERE u.telegram_id = %s AND u.is_active = true
                """, (telegram_id,))
                result = cursor.fetchone()
                return result['role_name'] if result else None
        except Exception as e:
            logger.error(f"Ошибка получения роли: {e}")
            return None
    
    def link_telegram_to_user(self, email: str, telegram_id: int, telegram_username: str) -> bool:
        """Привязать Telegram к существующему пользователю"""
        if not self.conn:
            if not self.connect():
                return False
        
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE users 
                    SET telegram_id = %s, telegram_username = %s 
                    WHERE email = %s AND is_active = true
                """, (telegram_id, telegram_username, email))
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Ошибка привязки Telegram: {e}")
            return False
    
    def create_admin_role(self, user_id: int, role_name: str, permissions: dict) -> bool:
        """Создать админ роль для пользователя"""
        if not self.conn:
            if not self.connect():
                return False
        
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO admin_roles (user_id, role_name, permissions)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id) 
                    DO UPDATE SET role_name = %s, permissions = %s, updated_at = NOW()
                """, (user_id, role_name, permissions, role_name, permissions))
                return True
        except Exception as e:
            logger.error(f"Ошибка создания роли: {e}")
            return False
    
    def get_user_by_email(self, email: str) -> dict:
        """Получить пользователя по email"""
        if not self.conn:
            if not self.connect():
                return None
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, email, full_name, telegram_id 
                    FROM users 
                    WHERE email = %s AND is_active = true
                """, (email,))
                return cursor.fetchone()
        except Exception as e:
            logger.error(f"Ошибка поиска пользователя: {e}")
            return None
    
    def get_all_admins(self) -> list:
        """Получить всех администраторов"""
        if not self.conn:
            if not self.connect():
                return []
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT u.id, u.email, u.full_name, u.telegram_id, u.telegram_username,
                           ar.role_name, ar.permissions, ar.created_at
                    FROM users u
                    LEFT JOIN admin_roles ar ON u.id = ar.user_id
                    WHERE u.is_active = true AND ar.role_name IS NOT NULL
                    ORDER BY ar.created_at DESC
                """)
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"Ошибка получения админов: {e}")
            return []

# Инициализация БД
db = BotDatabase()

class SystemMonitor:
    def __init__(self, bot_application):
        self.bot = bot_application
        self.monitoring_enabled = False
        
    async def run_health_checks(self):
        """Запустить проверку здоровья всех сервисов"""
        logger.info("🔍 Запуск проверки здоровья системы...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'services': {},
            'overall_status': 'unknown'
        }
        
        services = [
            ('Фронтенд', 'http://localhost:3000', 'frontend'),
            ('Бэкенд', 'http://localhost:3002/health', 'backend'),
            ('Админ панель', 'http://localhost:3003', 'admin'),
            ('База данных', None, 'database'),
            ('Redis', None, 'redis'),
            ('Nginx', 'http://localhost', 'nginx')
        ]
        
        all_healthy = True
        
        for service_name, url, service_key in services:
            status = await self.check_service_health(service_name, url, service_key)
            results['services'][service_key] = status
            
            if status['status'] != 'healthy':
                all_healthy = False
        
        results['overall_status'] = 'healthy' if all_healthy else 'unhealthy'
        
        # Отправляем уведомление
        await self.send_health_notification(results)
        
        return results
    
    async def check_service_health(self, service_name, url, service_key):
        """Проверить здоровье конкретного сервиса"""
        result = {
            'name': service_name,
            'status': 'unhealthy',
            'response_time': None,
            'error': None,
            'logs': None
        }
        
        start_time = time.time()
        
        try:
            if url:
                # HTTP проверка
                response = requests.get(url, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code < 400:
                    result['status'] = 'healthy'
                    result['response_time'] = f"{response_time:.2f}ms"
                else:
                    result['error'] = f"HTTP {response.status_code}"
                    result['logs'] = f"Response status: {response.status_code}"
                    
            elif service_key == 'database':
                # Проверка подключения к БД
                if db.connect():
                    with db.conn.cursor() as cursor:
                        cursor.execute("SELECT 1")
                        result['status'] = 'healthy'
                        result['response_time'] = f"{(time.time() - start_time) * 1000:.2f}ms"
                else:
                    result['error'] = "Database connection failed"
                    
            elif service_key == 'redis':
                # Проверка Redis
                try:
                    import redis
                    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
                    r.ping()
                    result['status'] = 'healthy'
                    result['response_time'] = f"{(time.time() - start_time) * 1000:.2f}ms"
                except Exception as e:
                    result['error'] = str(e)
            
            # Получаем последние логи для сервиса
            result['logs'] = await self.get_service_logs(service_key)
            
        except Exception as e:
            result['error'] = str(e)
            # Получаем логи при ошибке
            result['logs'] = await self.get_service_logs(service_key)
        
        return result
    
    async def get_service_logs(self, service_key):
        """Получить последние логи сервиса"""
        try:
            if service_key == 'frontend':
                cmd = "docker logs neymaryshop_frontend --tail=20 --since=1h"
            elif service_key == 'backend':
                cmd = "docker logs neymaryshop_backend --tail=20 --since=1h"
            elif service_key == 'admin':
                cmd = "docker logs neymaryshop_admin --tail=20 --since=1h"
            elif service_key == 'telegram_bot':
                cmd = "docker logs neymaryshop_bot --tail=20 --since=1h"
            elif service_key == 'postgres':
                cmd = "docker logs neymaryshop_db --tail=20 --since=1h"
            elif service_key == 'redis':
                cmd = "docker logs neymaryshop_redis --tail=20 --since=1h"
            elif service_key == 'nginx':
                cmd = "docker logs neymaryshop_nginx --tail=20 --since=1h"
            else:
                return None
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                return result.stdout[-500:]  # Последние 500 символов
            else:
                return f"Error getting logs: {result.stderr}"
                
        except Exception as e:
            return f"Error getting logs: {str(e)}"
    
    async def send_health_notification(self, results):
        """Отправить уведомление о здоровье системы"""
        try:
            emoji = "✅" if results['overall_status'] == 'healthy' else "❌"
            
            message = f"{emoji} *Проверка здоровья системы*\n\n"
            message += f"🕐 Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            message += f"📊 Общий статус: {'ЗДОРОВО' if results['overall_status'] == 'healthy' else 'ПРОБЛЕМЫ'}\n\n"
            
            for service_key, service_data in results['services'].items():
                status_emoji = "✅" if service_data['status'] == 'healthy' else "❌"
                message += f"{status_emoji} {service_data['name']}: {service_data['status'].upper()}\n"
                
                if service_data['response_time']:
                    message += f"   ⏱️ {service_data['response_time']}\n"
                
                if service_data['error']:
                    message += f"   ❌ Ошибка: {service_data['error'][:100]}...\n"
            
            # Если есть проблемы, добавляем логи
            if results['overall_status'] != 'healthy':
                message += "\n📋 *Логи проблемных сервисов:*\n"
                
                for service_key, service_data in results['services'].items():
                    if service_data['status'] != 'healthy' and service_data['logs']:
                        message += f"\n🔸 {service_data['name']}:\n"
                        message += f"```\n{service_data['logs'][-300:]}\n```\n"
            
            await self.bot.bot.send_message(
                chat_id=SUPER_ADMIN_ID,
                text=message,
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления: {e}")

# Глобальный монитор
monitor = None

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /start"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if user_role:
        # Полное меню команд для всех ролей
        commands_text = (
            f"🔐 Добро пожаловать в админ панель, {user.full_name}!\n\n"
            f"Ваша роль: {user_role}\n\n"
            f"📋 **Управление:**\n"
            f"/admins - Список администраторов\n"
            f"/add_admin - Добавить администратора\n"
            f"/link - Привязать аккаунт\n"
            f"/add_email - Добавить админа по email\n\n"
            f"📊 **Мониторинг:**\n"
            f"/stats - Статистика магазина\n"
            f"/system - Системные команды\n"
            f"/health - Проверить здоровье системы\n\n"
            f"💰 **Платежи:**\n"
            f"/verify_payment - Верификация платежей\n\n"
            f"🛠️ **Системные:**\n"
            f"/deploy - Запуск админ панели\n"
            f"/install - Полная установка системы\n\n"
            f"🔧 **Управление ПК:**\n"
            f"/shutdown - Выключить ПК после запуска\n"
            f"/start_monitoring - Начать мониторинг\n\n"
            f"ℹ️ **Информация:**\n"
            f"/start - Показать это меню\n"
        )
        
        if user_role == 'super_admin':
            commands_text += (
                f"\n🔑 **Super Admin команды:**\n"
                f"Доступны все системные команды управления\n"
                f"включая перезагрузку сервисов и установку"
            )
        
        await update.message.reply_text(commands_text)
    else:
        keyboard = [
            [InlineKeyboardButton("🔐 Привязать аккаунт", callback_data="link_account")],
            [InlineKeyboardButton("ℹ️ Информация", callback_data="info")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            f"👋 Добро пожаловать, {user.full_name}!\n\n"
            f"Это бот управления магазином NeymaryShop.\n\n"
            f"У вас нет прав администратора. "
            f"Если вы администратор, привяжите свой аккаунт.",
            reply_markup=reply_markup
        )

async def health_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /health - проверка здоровья системы"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role or user_role not in ['super_admin', 'admin']:
        await update.message.reply_text("❌ Только администраторы могут проверять здоровье системы.")
        return
    
    await update.message.reply_text("🔍 Запускаю проверку здоровья системы...")
    
    if monitor:
        results = await monitor.run_health_checks()
        
        if results['overall_status'] == 'healthy':
            await update.message.reply_text("✅ Все сервисы работают исправно!")
        else:
            await update.message.reply_text("❌ Обнаружены проблемы. Подробности отправлены в личные сообщения.")
    else:
        await update.message.reply_text("❌ Мониторинг не инициализирован")

async def shutdown_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /shutdown - выключить ПК"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role or user_role != 'super_admin':
        await update.message.reply_text("❌ Только super_admin может выключать систему.")
        return
    
    keyboard = [
        [InlineKeyboardButton("✅ Да, выключить через 5 минут", callback_data="shutdown_confirm")],
        [InlineKeyboardButton("❌ Отмена", callback_data="shutdown_cancel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "⚠️ Вы уверены, что хотите выключить систему?\n\n"
        "Это выключит:\n"
        "• Все Docker контейнеры\n"
        "• Сервер\n"
        "• Компьютер\n\n"
        "Действие необратимо!",
        reply_markup=reply_markup
    )

async def start_monitoring_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /start_monitoring - начать мониторинг"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role or user_role != 'super_admin':
        await update.message.reply_text("❌ Только super_admin может запускать мониторинг.")
        return
    
    if monitor:
        monitor.monitoring_enabled = True
        await update.message.reply_text("✅ Мониторинг включен")
        
        # Запускаем фоновую задачу
        asyncio.create_task(monitoring_loop())
    else:
        await update.message.reply_text("❌ Мониторинг не инициализирован")

async def monitoring_loop():
    """Фоновый цикл мониторинга"""
    if not monitor or not monitor.monitoring_enabled:
        return
    
    while monitor.monitoring_enabled:
        try:
            await monitor.run_health_checks()
            await asyncio.sleep(300)  # Каждые 5 минут
        except Exception as e:
            logger.error(f"Ошибка в цикле мониторинга: {e}")
            await asyncio.sleep(60)

# ... [все остальные функции из предыдущей версии] ...

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик ошибок"""
    logger.error(f"Exception while handling an update: {context.error}")

def main() -> None:
    """Основная функция"""
    global monitor
    
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN не найден в переменных окружения!")
        return
    
    # Создание приложения
    application = Application.builder().token(token).build()
    
    # Инициализация монитора
    monitor = SystemMonitor(application)
    
    # Обработчики команд
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("health", health_command))
    application.add_handler(CommandHandler("shutdown", shutdown_command))
    application.add_handler(CommandHandler("start_monitoring", start_monitoring_command))
    
    # Обработчик кнопок
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Обработчик ошибок
    application.add_error_handler(error_handler)
    
    # Запуск бота
    logger.info("🤖 Запуск Telegram бота...")
    application.run_polling()

if __name__ == '__main__':
    main()