import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Pool, PoolClient } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis client
let redis: RedisClientType;

async function initRedis() {
  redis = createClient({ 
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }) as RedisClientType;
  
  redis.on('error', (err) => console.error('Redis error:', err));
  await redis.connect();
  console.log('✅ Redis connected');
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов, попробуйте позже' }
});
app.use('/api', limiter);

// Health check
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
    const cached = await redis.get(cacheKey);
    
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
    
    await redis.setEx(cacheKey, 300, JSON.stringify(result.rows));
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Ошибка при получении товаров' });
  }
});

app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const cached = await redis.get('categories:all');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await pool.query(`
      SELECT * FROM categories 
      WHERE is_active = true 
      ORDER BY sort_order
    `);
    
    await redis.setEx('categories:all', 600, JSON.stringify(result.rows));
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
    const cached = await redis.get('payment_methods');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await pool.query(`
      SELECT key, value FROM settings 
      WHERE key LIKE 'payment_%'
    `);

    const getValue = (key: string) => 
      result.rows.find(r => r.key === key)?.value || '';

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

    await redis.setEx('payment_methods', 300, JSON.stringify(methods));
    res.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Ошибка при получении способов оплаты' });
  }
});

// ==========================================
// ORDERS API
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
    `, [
      price,
      payment_method,
      customer_email || null,
      customer_telegram || null,
      JSON.stringify({ product_name: product.name })
    ]);

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
// ADMIN API
// ==========================================

const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

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

    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE orders 
      SET 
        status = 'confirmed',
        payment_status = 'received',
        updated_at = NOW()
      WHERE id = $1 AND status = 'awaiting_confirmation'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = result.rows[0];

    broadcastToClient(order.id.toString(), {
      type: 'payment_confirmed',
      order_id: order.id
    });

    setTimeout(async () => {
      try {
        await pool.query(`
          UPDATE orders 
          SET status = 'processing', updated_at = NOW()
          WHERE id = $1
        `, [id]);

        broadcastToClient(id, {
          type: 'order_processing',
          order_id: id
        });

        setTimeout(async () => {
          try {
            await pool.query(`
              UPDATE orders 
              SET status = 'completed', completed_at = NOW(), updated_at = NOW()
              WHERE id = $1
            `, [id]);

            await pool.query(`
              UPDATE order_items 
              SET 
                delivery_data = jsonb_build_object('code', 'XXXX-XXXX-XXXX-XXXX'),
                delivered_at = NOW()
              WHERE order_id = $1
            `, [id]);

            broadcastToClient(id, {
              type: 'order_completed',
              order_id: id,
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

    await redis.del('payment_methods');

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
// WEBSOCKET
// ==========================================

const clients = new Map<string, WSWebSocket>();
const adminClients = new Set<WSWebSocket>();

function broadcastToClient(orderId: string, data: any) {
  const client = clients.get(orderId);
  if (client && client.readyState === WSWebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}

function broadcastToAdmins(data: any) {
  adminClients.forEach(client => {
    if (client.readyState === WSWebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
  try {
    await initRedis();
    
    const server = http.createServer(app);
    
    const wss = new WebSocketServer({ noServer: true });
    
    wss.on('connection', (ws: WSWebSocket, request: http.IncomingMessage) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const orderId = url.searchParams.get('order_id');
      const isAdmin = url.searchParams.get('admin') === 'true';

      if (isAdmin) {
        adminClients.add(ws);
      } else if (orderId) {
        clients.set(orderId, ws);
      }

      ws.on('close', () => {
        if (isAdmin) {
          adminClients.delete(ws);
        } else if (orderId) {
          clients.delete(orderId);
        }
      });
    });

    server.on('upgrade', (request: http.IncomingMessage, socket: any, head: Buffer) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    server.listen(PORT, () => {
      console.log(`✅ Backend running on port ${PORT}`);
      console.log(`📊 Database: connected`);
      console.log(`🔴 Redis: connected`);
      console.log(`🔌 WebSocket: ready`);
    });

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await pool.end();
        await redis.quit();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
