INSERT INTO settings (key, value, description, updated_at) VALUES
('api_host', 'http://localhost:3001', 'API сервер адрес', NOW()),
('frontend_host', 'http://localhost:3000', 'Frontend сервер адрес', NOW())
ON CONFLICT (key) DO NOTHING;

-- Update existing settings descriptions
UPDATE settings SET description = 'Криптовалюта включена' WHERE key = 'payment_crypto_enabled';
UPDATE settings SET description = 'TON кошелёк для приёма платежей' WHERE key = 'payment_crypto_address';
UPDATE settings SET description = 'Карты РФ включены' WHERE key = 'payment_card_enabled';
UPDATE settings SET description = 'Номер карты для приёма платежей' WHERE key = 'payment_card_number';
UPDATE settings SET description = 'Владелец карты' WHERE key = 'payment_card_holder';
UPDATE settings SET description = 'Название банка' WHERE key = 'payment_card_bank';

-- Add comment
COMMENT ON TABLE settings IS 'Системные настройки включая hosts и платёжные данные';
