-- 1. Таблица для отслеживания подозрительных действий
CREATE TABLE IF NOT EXISTS security_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска подозрительных активностей
CREATE INDEX IF NOT EXISTS idx_security_events_user_event ON security_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);

-- 2. Таблица для хранения сессий 2FA (временные)
CREATE TABLE IF NOT EXISTS two_factor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret_temp VARCHAR(32) NOT NULL,
    backup_codes_temp TEXT[],
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_expires ON two_factor_sessions(expires_at);

-- 3. Таблица блокировок IP для защиты от брутфорса
CREATE TABLE IF NOT EXISTS ip_blocks (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    block_reason VARCHAR(100),
    block_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_blocks_block_until ON ip_blocks(block_until);

-- 4. Улучшенная таблица rate limits с поддержкой разных типов
CREATE TABLE IF NOT EXISTS enhanced_rate_limits (
    key VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    attempts INTEGER DEFAULT 1,
    first_attempt TIMESTAMPTZ DEFAULT NOW(),
    last_attempt TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    PRIMARY KEY (key, type)
);

-- 5. Функция для проверки сложности пароля (улучшенная)
CREATE OR REPLACE FUNCTION validate_password_complexity(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        length(password) >= 8 AND
        password ~ '[A-Z]' AND      -- хотя бы одна заглавная
        password ~ '[a-z]' AND      -- хотя бы одна строчная
        password ~ '\d' AND         -- хотя бы одна цифра
        password ~ '[!@#$%^&*(),.?":{}|<>]' AND  -- хотя бы один спецсимвол
        NOT password ~ '(.)\1{2,}'  -- не более 2 повторяющихся символов подряд
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Триггер для проверки пароля при вставке/обновлении
CREATE OR REPLACE FUNCTION check_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password_hash IS NOT NULL THEN
        -- Проверяем сложность пароля перед хэшированием
        -- Предполагаем, что пароль передается в открытом виде для хэширования
        -- В реальном приложении это должно делаться на уровне приложения
        IF NOT validate_password_complexity(NEW.password_hash) THEN
            RAISE EXCEPTION 'Пароль не соответствует требованиям безопасности';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_password_check ON users;
CREATE TRIGGER users_password_check
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_password_trigger();

-- 7. Функция для очистки старых данных безопасности
CREATE OR REPLACE FUNCTION cleanup_security_data()
RETURNS void AS $$
BEGIN
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM two_factor_sessions WHERE expires_at < NOW();
    DELETE FROM ip_blocks WHERE block_until < NOW();
    DELETE FROM enhanced_rate_limits WHERE last_attempt < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Создаем планировщик для очистки (если не существует)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_proc 
        WHERE proname = 'cleanup_security_data'
    ) THEN
        PERFORM pg_catalog.set_config('search_path', 'public', false);
        PERFORM cleanup_security_data();
    END IF;
END
$$;
