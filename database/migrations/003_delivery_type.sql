-- NeymaryShop Database Migration - Delivery Type
-- Добавление типа доставки для товаров

-- ==========================================
-- DELIVERY TYPE ENUM
-- ==========================================

-- Создаём тип для способа доставки
DO $$ BEGIN
    CREATE TYPE delivery_type AS ENUM ('manual', 'auto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- UPDATE PRODUCTS TABLE
-- ==========================================

-- Добавляем поле delivery_type
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_type delivery_type DEFAULT 'auto';

-- Добавляем поле для хранения кодов (для auto доставки)
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_codes BOOLEAN DEFAULT FALSE;

-- ==========================================
-- PRODUCT CODES TABLE (для автовыдачи)
-- ==========================================

CREATE TABLE IF NOT EXISTS product_codes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    order_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_codes_product ON product_codes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_codes_used ON product_codes(is_used);

-- ==========================================
-- UPDATE ORDERS TABLE
-- ==========================================

-- Добавляем поле для типа доставки в заказе
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type delivery_type DEFAULT 'auto';

-- Добавляем поле для данных доставки
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_data JSONB DEFAULT '{}'::jsonb;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON COLUMN products.delivery_type IS 'Тип доставки: manual (вход в аккаунт) или auto (код)';
COMMENT ON COLUMN orders.delivery_type IS 'Тип доставки заказа';
COMMENT ON TABLE product_codes IS 'Коды товаров для автовыдачи';
