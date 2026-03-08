/**
 * Admin Products & Categories CRUD API
 */
import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware для админской авторизации
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

// ==========================================
// CATEGORIES CRUD
// ==========================================

// Получить все категории
router.get('/categories', adminAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY sort_order');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Ошибка при получении категорий' });
  }
});

// Создать категорию
router.post('/categories', adminAuth, async (req: Request, res: Response) => {
  try {
    const { name, slug, description, icon_url, sort_order = 0 } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Название и slug обязательны' });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, icon_url, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, slug, description || null, icon_url || null, sort_order]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message || 'Ошибка при создании категории' });
  }
});

// Обновить категорию
router.put('/categories/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon_url, sort_order, is_active } = req.body;

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           icon_url = COALESCE($4, icon_url),
           sort_order = COALESCE($5, sort_order),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, slug, description, icon_url, sort_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message || 'Ошибка при обновлении категории' });
  }
});

// Удалить категорию
router.delete('/categories/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json({ message: 'Категория удалена' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message || 'Ошибка при удалении категории' });
  }
});

// ==========================================
// PRODUCTS CRUD
// ==========================================

// Получить все товары
router.get('/products', adminAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Ошибка при получении товаров' });
  }
});

// Создать товар
router.post('/products', adminAuth, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price_android,
      price_pc,
      price_ios,
      category_id,
      image_url,
      delivery_type = 'auto',
      stock_quantity = 0
    } = req.body;

    if (!name || !category_id || !price_android) {
      return res.status(400).json({ error: 'Название, категория и цена обязательны' });
    }

    const result = await pool.query(
      `INSERT INTO products (
        name, description, price_android, price_pc, price_ios,
        category_id, image_url, delivery_type, stock_quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        name,
        description || null,
        price_android,
        price_pc || price_android,
        price_ios || price_android,
        category_id,
        image_url || null,
        delivery_type,
        stock_quantity
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message || 'Ошибка при создании товара' });
  }
});

// Обновить товар
router.put('/products/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price_android,
      price_pc,
      price_ios,
      category_id,
      image_url,
      delivery_type,
      stock_quantity,
      is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price_android = COALESCE($3, price_android),
           price_pc = COALESCE($4, price_pc),
           price_ios = COALESCE($5, price_ios),
           category_id = COALESCE($6, category_id),
           image_url = COALESCE($7, image_url),
           delivery_type = COALESCE($8, delivery_type),
           stock_quantity = COALESCE($9, stock_quantity),
           is_active = COALESCE($10, is_active),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name,
        description,
        price_android,
        price_pc,
        price_ios,
        category_id,
        image_url,
        delivery_type,
        stock_quantity,
        is_active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message || 'Ошибка при обновлении товара' });
  }
});

// Удалить товар
router.delete('/products/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json({ message: 'Товар удалён' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message || 'Ошибка при удалении товара' });
  }
});

// ==========================================
// PRODUCT CODES MANAGEMENT (для автовыдачи)
// ==========================================

// Получить коды для товара
router.get('/products/:id/codes', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM product_codes WHERE product_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product codes:', error);
    res.status(500).json({ error: 'Ошибка при получении кодов' });
  }
});

// Добавить коды для товара (массовая загрузка)
router.post('/products/:id/codes', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { codes } = req.body; // массив строк

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ error: 'Коды должны быть массивом' });
    }

    const values = codes.map((code, index) => `($1, $${index + 2}, NOW())`).join(',');
    const params = [id, ...codes];

    await pool.query(
      `INSERT INTO product_codes (product_id, code, created_at) VALUES ${values}`,
      params
    );

    // Обновляем флаг has_codes
    await pool.query(
      'UPDATE products SET has_codes = TRUE WHERE id = $1',
      [id]
    );

    res.json({ message: `Добавлено ${codes.length} кодов` });
  } catch (error: any) {
    console.error('Error adding product codes:', error);
    res.status(500).json({ error: error.message || 'Ошибка при добавлении кодов' });
  }
});

// Удалить неиспользованный код
router.delete('/products/:productId/codes/:codeId', adminAuth, async (req: Request, res: Response) => {
  try {
    const { productId, codeId } = req.params;

    const result = await pool.query(
      'DELETE FROM product_codes WHERE id = $1 AND product_id = $2 AND is_used = FALSE RETURNING *',
      [codeId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Код не найден или уже использован' });
    }

    res.json({ message: 'Код удалён' });
  } catch (error: any) {
    console.error('Error deleting product code:', error);
    res.status(500).json({ error: error.message || 'Ошибка при удалении кода' });
  }
});

export default router;
