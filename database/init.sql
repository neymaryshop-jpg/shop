-- NeymaryShop Database Schema
-- Оптимизирован для работы с ограниченными ресурсами

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- === ПОЛЬЗОВАТЕЛИ ===
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id) WHERE telegram_id IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;

-- === СЕССИИ ===
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- === КАТЕГОРИИ ===
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_categories_slug ON categories(slug);

-- === ТОВАРЫ ===
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    image_url VARCHAR(500),
    
    cost_price DECIMAL(10, 2) NOT NULL,
    commission_percent DECIMAL(5, 2) NOT NULL,
    price_android DECIMAL(10, 2) NOT NULL,
    price_pc DECIMAL(10, 2) NOT NULL,
    price_ios DECIMAL(10, 2) NOT NULL,
    
    stock_quantity INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_products_category_id ON products(category_id) WHERE is_active = true;
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- === ЗАКАЗЫ ===
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    platform VARCHAR(20),
    
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_transaction_id VARCHAR(255),
    
    customer_email VARCHAR(255),
    customer_telegram VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- === ПОЗИЦИИ ЗАКАЗА ===
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10, 2) NOT NULL,
    
    delivery_data JSONB,
    delivered_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- === КОРЗИНА ===
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    platform VARCHAR(20) DEFAULT 'android',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, product_id, platform)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- === УВЕДОМЛЕНИЯ ===
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- === ПРОМОКОДЫ ===
CREATE TABLE promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = true;

-- === СИСТЕМНЫЕ НАСТРОЙКИ ===
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === ЛОГИ ===
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON system_logs(level) WHERE level IN ('error', 'critical');

-- === ТРИГГЕРЫ ===

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_product_sales_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE products 
        SET sales_count = sales_count + (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM order_items 
            WHERE order_id = NEW.id
        )
        WHERE id IN (
            SELECT product_id FROM order_items WHERE order_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_count_trigger 
AFTER UPDATE ON orders
FOR EACH ROW 
EXECUTE FUNCTION update_product_sales_count();

-- === НАЧАЛЬНЫЕ ДАННЫЕ ===

INSERT INTO categories (name, slug, sort_order, is_active) VALUES
('Игры', 'games', 1, true),
('Подписки', 'subscriptions', 2, true),
('Валюта', 'currency', 3, true),
('Аккаунты', 'accounts', 4, true),
('ПО', 'software', 5, true),
('Стриминг', 'streaming', 6, true);

INSERT INTO settings (key, value, description) VALUES
('site_name', 'NeymaryShop', 'Название сайта'),
('site_url', 'http://neymaryshop.ton', 'URL сайта'),
('maintenance_mode', 'false', 'Режим обслуживания'),
('max_cart_items', '100', 'Максимум товаров в корзине'),
('default_platform', 'android', 'Платформа по умолчанию'),
('payment_crypto_enabled', 'false', 'Криптовалюта включена'),
('payment_crypto_address', 'UQD3_your_ton_wallet_address_here', 'TON кошелёк'),
('payment_card_enabled', 'true', 'Карты РФ включены'),
('payment_card_number', '2200 7012 3242 4173', 'Номер карты'),
('payment_card_holder', 'Анна И.', 'Владелец карты'),
('payment_card_bank', 'T-банк', 'Название банка');

-- === ФУНКЦИЯ АРХИВАЦИИ ===

CREATE OR REPLACE FUNCTION archive_old_orders()
RETURNS void AS $$
BEGIN
    DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days' AND is_read = true;
END;
$$ LANGUAGE plpgsql;

-- === ПРЕДСТАВЛЕНИЯ ===

CREATE OR REPLACE VIEW popular_products AS
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
ORDER BY p.sales_count DESC, p.created_at DESC
LIMIT 20;

CREATE OR REPLACE VIEW order_statistics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    SUM(total_amount) FILTER (WHERE status = 'completed') as revenue
FROM orders
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

VACUUM ANALYZE;	
