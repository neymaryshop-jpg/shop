import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PoolClient } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { pool } from './database';
import uploadRouter from './routes/upload';
import adminOrdersRouter from './routes/adminOrders';
import featuresRouter from './routes/features';
import adminProductsRouter from './routes/adminProducts';
import ordersRouter from './routes/orders';
import { sendTelegramNotification } from './services/telegramService';
import { requestLogger, errorLogger, userActionLogger, authLogger } from './middleware/logger';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002');
const server = http.createServer(app);

// ==========================================
// REDIS
// ==========================================

let redis: RedisClientType | null = null;

async function initRedis() {
  try {
    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    }) as RedisClientType;

    redis.on('error', (err) => {
      console.warn('Redis error (cache disabled):', err.message);
    });

    await redis.connect();
    console.log('✅ Redis connected');
  } catch (error: any) {
    console.warn('⚠️ Redis not available, caching disabled:', error.message);
    redis = null;
  }
}

async function redisGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try { return await redis.get(key); } catch { return null; }
}

async function redisSetEx(key: string, ttl: number, value: string): Promise<void> {
  if (!redis) return;
  try { await redis.setEx(key, ttl, value); } catch {}
}

async function redisDel(key: string): Promise<void> {
  if (!redis) return;
  try { await redis.del(key); } catch {}
}

async function redisQuit(): Promise<void> {
  if (!redis) return;
  try { await redis.quit(); } catch {}
}

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS - должен быть ПЕРВЫМ
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3003',
  'http://frontend:3000',
  'http://admin:3003',
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:3003',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
      callback(null, origin);
    } else {
      callback(null, '*');
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Безопасность (Helmet) с отключёнными конфликтующими политиками
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
}));

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static('uploads'));
app.use('/uploads/product_images', express.static('uploads/product_images'));
app.use('/uploads/category_images', express.static('uploads/category_images'));

// Логирование
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов, попробуйте позже' }
});
app.use('/api', limiter);

// ==========================================
// ROUTES
// ==========================================

app.use('/api', uploadRouter);
app.use('/api/admin', adminOrdersRouter);
app.use('/api/admin', adminProductsRouter);
app.use('/api', featuresRouter);
app.use('/api/orders', ordersRouter);

// ==========================================
// ОСНОВНЫЕ ENDPOINTS
// ==========================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'NeymaryShop Backend API',
    status: 'running',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      wishlist: '/api/wishlist',
      reviews: '/api/products/:id/reviews',
      notifications: '/api/notifications',
      compare: '/api/compare',
      referral: '/api/referral',
      coupons: '/api/coupons',
      newsletter: '/api/newsletter',
      support: '/api/support'
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==========================================
// PRODUCTS API
// ==========================================

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, search, limit = '50' } = req.query;

    const cacheKey = `products:${category || 'all'}:${search || ''}`;
    const cached = await redisGet(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (category && category !== 'all') {
      query += ` AND c.slug = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND p.name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY p.sales_count DESC, p.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);
    await redisSetEx(cacheKey, 300, JSON.stringify(result.rows));

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Ошибка при получении товаров' });
  }
});

app.get('/api/products/new-arrivals', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const cacheKey = `products:new-arrivals:${limit}`;
    const cached = await redisGet(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
        AND p.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY p.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [parseInt(limit as string)]);
    await redisSetEx(cacheKey, 600, JSON.stringify(result.rows));

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    res.status(500).json({ error: 'Ошибка при получении новинок' });
  }
});

app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const cached = await redisGet('categories:all');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await pool.query(`
      SELECT * FROM categories
      WHERE is_active = true
      ORDER BY sort_order
    `);

    await redisSetEx('categories:all', 600, JSON.stringify(result.rows));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Ошибка при получении категорий' });
  }
});

// ==========================================
// PAYMENT METHODS API
// ==========================================

app.get('/api/payment-methods', async (req: Request, res: Response) => {
  try {
    const cached = await redisGet('payment_methods');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await pool.query(`
      SELECT key, value FROM settings
      WHERE key LIKE 'payment_%'
    `);

    const getValue = (key: string) =>
      result.rows.find((r: any) => r.key === key)?.value || '';

    const methods = [
      {
        id: 'crypto',
        name: 'Криптовалюта (TON)',
        icon: '💎',
        description: 'Быстро и анонимно',
        enabled: getValue('payment_crypto_enabled') === 'true',
        details: {
          address: getValue('payment_crypto_address'),
          network: 'TON'
        }
      },
      {
        id: 'ru-card',
        name: 'Карты РФ',
        icon: '💳',
        description: 'Сбербанк, Тинькофф, ВТБ',
        enabled: getValue('payment_card_enabled') === 'true',
        details: {
          card_number: getValue('payment_card_number'),
          card_holder: getValue('payment_card_holder'),
          bank_name: getValue('payment_card_bank')
        }
      }
    ];

    await redisSetEx('payment_methods', 300, JSON.stringify(methods));
    res.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Ошибка при получении способов оплаты' });
  }
});

// ==========================================
// ORDERS API (публичные endpoints)
// ==========================================

interface CreateOrderBody {
  product_id: number;
  payment_method: string;
  customer_email?: string;
  customer_telegram?: string;
}

app.post('/api/orders', async (req: Request<{}, {}, CreateOrderBody>, res: Response) => {
  const client = await pool.connect();

  try {
    const { product_id, payment_method, customer_email, customer_telegram } = req.body;

    if (!product_id || !payment_method) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    await client.query('BEGIN');

    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const product = productResult.rows[0];
    const price = product.price_android;

    const orderResult = await client.query(`
      INSERT INTO orders (
        status, subtotal, total_amount, payment_method,
        customer_email, customer_telegram, metadata
      ) VALUES (
        'pending', $1, $1, $2, $3, $4, $5
      ) RETURNING *
    `, [price, payment_method, customer_email || null, customer_telegram || null, JSON.stringify({ product_name: product.name })]);

    const order = orderResult.rows[0];

    await client.query(`
      INSERT INTO order_items (
        order_id, product_id, product_name, product_price, quantity, subtotal
      ) VALUES ($1, $2, $3, $4, 1, $4)
    `, [order.id, product.id, product.name, price]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      order_id: order.id,
      order
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Ошибка при создании заказа' });
  } finally {
    client.release();
  }
});

app.post('/api/orders/:id/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE orders
      SET
        status = 'awaiting_confirmation',
        payment_status = 'pending',
        updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден или уже обработан' });
    }

    const order = result.rows[0];

    await sendTelegramNotification({
      type: 'new_payment',
      order_id: order.id,
      amount: order.total_amount
    });

    broadcastToAdmins({
      type: 'new_payment',
      order_id: order.id,
      amount: order.total_amount
    });

    res.json({
      success: true,
      message: 'Запрос отправлен администраторам',
      order
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Ошибка при подтверждении оплаты' });
  }
});

app.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT o.*,
        json_agg(
          json_build_object(
            'product_name', oi.product_name,
            'product_price', oi.product_price,
            'quantity', oi.quantity,
            'delivery_data', oi.delivery_data
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Ошибка при получении заказа' });
  }
});

// ==========================================
// ADMIN AUTH
// ==========================================

const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers.authorization?.replace('Bearer ', '');

  if (!adminToken) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, ar.role_name, ar.permissions
       FROM users u
       JOIN admin_sessions s ON u.id = s.user_id
       LEFT JOIN admin_roles ar ON u.id = ar.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [adminToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Сессия истекла' });
    }

    (req as any).admin = result.rows[0];
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
};

app.get('/api/admin/stats', adminAuth, async (req: Request, res: Response) => {
  try {
    const [totalOrders, pendingOrders, totalRevenue, todayOrders] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM orders'),
      pool.query('SELECT COUNT(*) as count FROM orders WHERE status = \'pending\' OR status = \'awaiting_confirmation\''),
      pool.query('SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status = \'completed\''),
      pool.query('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE')
    ]);

    res.json({
      totalOrders: parseInt(totalOrders.rows[0].count),
      pendingOrders: parseInt(pendingOrders.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].revenue),
      todayOrders: parseInt(todayOrders.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

app.get('/api/admin/orders', adminAuth, async (req: Request, res: Response) => {
  try {
    const { status, limit = '50' } = req.query;

    let query = `
      SELECT o.*,
        json_agg(
          json_build_object(
            'product_name', oi.product_name,
            'product_price', oi.product_price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;

    const params: any[] = [];
    if (status) {
      query += ` WHERE o.status = $1`;
      params.push(status);
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Ошибка при получении заказов' });
  }
});

app.post('/api/admin/orders/:id/confirm-received', adminAuth, async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const orderId = Array.isArray(id) ? id[0] : id;

    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE orders
      SET
        status = 'confirmed',
        payment_status = 'received',
        updated_at = NOW()
      WHERE id = $1 AND status = 'awaiting_confirmation'
      RETURNING *
    `, [orderId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = result.rows[0];

    broadcastToClient(orderId, {
      type: 'payment_confirmed',
      order_id: orderId
    });

    setTimeout(async () => {
      try {
        await pool.query(`
          UPDATE orders
          SET status = 'processing', updated_at = NOW()
          WHERE id = $1
        `, [orderId]);

        broadcastToClient(orderId, {
          type: 'order_processing',
          order_id: orderId
        });

        setTimeout(async () => {
          try {
            await pool.query(`
              UPDATE orders
              SET status = 'completed', completed_at = NOW(), updated_at = NOW()
              WHERE id = $1
            `, [orderId]);

            await pool.query(`
              UPDATE order_items
              SET
                delivery_data = jsonb_build_object('code', 'XXXX-XXXX-XXXX-XXXX'),
                delivered_at = NOW()
              WHERE order_id = $1
            `, [orderId]);

            broadcastToClient(orderId, {
              type: 'order_completed',
              order_id: orderId,
              code: 'XXXX-XXXX-XXXX-XXXX'
            });
          } catch (err) {
            console.error('Error completing order:', err);
          }
        }, 120000);

      } catch (err) {
        console.error('Error processing order:', err);
      }
    }, 120000);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Оплата подтверждена',
      order
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming received payment:', error);
    res.status(500).json({ error: 'Ошибка при подтверждении получения оплаты' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/payment-methods/:id/toggle', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const settingKey = `payment_${id}_enabled`;

    const current = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      [settingKey]
    );

    const newValue = current.rows[0]?.value === 'true' ? 'false' : 'true';

    await pool.query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = $2, updated_at = NOW()
    `, [settingKey, newValue]);

    await redisDel('payment_methods');

    res.json({
      success: true,
      enabled: newValue === 'true'
    });

  } catch (error) {
    console.error('Error toggling payment method:', error);
    res.status(500).json({ error: 'Ошибка при переключении способа оплаты' });
  }
});

// ==========================================
// ADMIN AUTH API
// ==========================================

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

app.post('/api/auth/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    const result = await pool.query(
      `SELECT u.*, ar.role_name, ar.permissions
       FROM users u
       LEFT JOIN admin_roles ar ON u.id = ar.user_id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    if (!user.role_name) {
      return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав администратора.' });
    }

    let validPassword: boolean;
    if (password.startsWith('$2b$')) {
      validPassword = password === user.password_hash;
    } else {
      validPassword = await bcrypt.compare(password, user.password_hash);
    }

    if (!validPassword) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken();

    await pool.query(
      'INSERT INTO admin_sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, token]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role_name,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Ошибка при входе' });
  }
});

app.post('/api/auth/admin/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      await pool.query('DELETE FROM admin_sessions WHERE token = $1', [token]);
    }

    res.json({ message: 'Вы вышли из системы' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ message: 'Ошибка при выходе' });
  }
});

app.get('/api/auth/admin/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.telegram_username, u.created_at, u.last_login,
              ar.role_name, ar.permissions
       FROM users u
       JOIN admin_sessions s ON u.id = s.user_id
       LEFT JOIN admin_roles ar ON u.id = ar.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Сессия истекла' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});

// ==========================================
// AUTH API
// ==========================================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть минимум 6 символов' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    let password_hash: string;
    if (password.startsWith('$2b$')) {
      password_hash = password;
    } else {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
      password_hash = await bcrypt.hash(password, saltRounds);
    }

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, is_verified)
       VALUES ($1, $2, $3, true)
       RETURNING id, email, full_name, created_at`,
      [email, password_hash, full_name || null]
    );

    const user = result.rows[0];
    const token = generateToken();
    const refreshToken = generateRefreshToken();

    await pool.query(
      'INSERT INTO sessions (user_id, token, refresh_token, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'7 days\')',
      [user.id, token, refreshToken]
    );

    res.status(201).json({
      user: { id: user.id, email: user.email, full_name: user.full_name },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Ошибка при регистрации' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    let validPassword: boolean;
    if (password.startsWith('$2b$')) {
      validPassword = password === user.password_hash;
    } else {
      validPassword = await bcrypt.compare(password, user.password_hash);
    }

    if (!validPassword) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken();
    const refreshToken = generateRefreshToken();

    await pool.query(
      'INSERT INTO sessions (user_id, token, refresh_token, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'7 days\')',
      [user.id, token, refreshToken]
    );

    res.json({
      user: { id: user.id, email: user.email, full_name: user.full_name },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка при входе' });
  }
});

app.get('/api/auth/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.telegram_username, u.created_at
       FROM users u
       JOIN sessions s ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Сессия истекла' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    }

    res.json({ message: 'Вы вышли из системы' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Ошибка при выходе' });
  }
});

// ==========================================
// WEBSOCKET
// ==========================================

const clients: Map<string, Set<WSWebSocket>> = new Map();

function broadcastToAdmins(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      if (client.readyState === WSWebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}

function broadcastToClient(userId: string, data: any) {
  const userClients = clients.get(userId);
  if (!userClients) return;

  const message = JSON.stringify(data);
  userClients.forEach((client) => {
    if (client.readyState === WSWebSocket.OPEN) {
      client.send(message);
    }
  });
}

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WSWebSocket, req: http.IncomingMessage) => {
  const userId = req.url?.split('?')[1]?.split('=')[1] || 'anonymous';

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(ws);

  ws.on('close', () => {
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        clients.delete(userId);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// ==========================================
// ЗАПУСК СЕРВЕРА
// ==========================================

async function bootstrap() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }

  await initRedis();

  app.use(errorLogger);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Available on: http://0.0.0.0:${PORT}`);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
      await redisQuit();
      await pool.end();
      process.exit(0);
    });
  });
}

bootstrap();

export default app;
