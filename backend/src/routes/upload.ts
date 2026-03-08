import express, { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import pg from 'pg';

const router = express.Router();
const { Pool } = pg;

// Подключение к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neymary:neymary123@localhost:5432/neymaryshop'
});

// Директория для загрузок
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const PRODUCT_IMAGES_DIR = path.join(__dirname, '../../uploads/product_images');
const CATEGORY_IMAGES_DIR = path.join(__dirname, '../../uploads/category_images');

// Создаём директории если их нет
Promise.all([
  fs.mkdir(UPLOAD_DIR, { recursive: true }),
  fs.mkdir(PRODUCT_IMAGES_DIR, { recursive: true }),
  fs.mkdir(CATEGORY_IMAGES_DIR, { recursive: true })
]).catch(console.error);

// Настройка Multer
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${hash}${ext}`);
  }
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Только изображения (JPEG, PNG, GIF, WEBP)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// POST /api/upload - загрузка файла
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// POST /api/upload/product-image - загрузка изображения товара
router.post('/upload/product-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Перемещаем файл в папку product_images
    const newFilename = `product_${Date.now()}_${path.basename(req.file.filename)}`;
    const newPath = path.join(PRODUCT_IMAGES_DIR, newFilename);
    
    await fs.rename(req.file.path, newPath);
    
    const fileUrl = `/uploads/product_images/${newFilename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: newFilename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// POST /api/upload/category-image - загрузка изображения категории
router.post('/upload/category-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Перемещаем файл в папку category_images
    const newFilename = `category_${Date.now()}_${path.basename(req.file.filename)}`;
    const newPath = path.join(CATEGORY_IMAGES_DIR, newFilename);
    
    await fs.rename(req.file.path, newPath);
    
    const fileUrl = `/uploads/category_images/${newFilename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: newFilename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// POST /api/upload/photo - загрузка фото для товара/категории
router.post('/upload/photo', upload.single('photo'), async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { entity_type, entity_id, is_primary } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Фото не загружено' });
    }
    
    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'Не указан тип сущности или ID' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    if (entity_type === 'product') {
      // Проверка существования товара
      const productCheck = await client.query(
        'SELECT id FROM products WHERE id = $1',
        [entity_id]
      );
      
      if (productCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Товар не найден' });
      }
      
      // Вставка фото товара
      const result = await client.query(
        `INSERT INTO product_photos (product_id, photo_url, is_primary, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id, product_id, photo_url, is_primary`,
        [entity_id, fileUrl, is_primary === 'true', 0]
      );
      
      res.json({
        success: true,
        photo: result.rows[0],
        url: fileUrl
      });
      
    } else if (entity_type === 'category') {
      // Проверка существования категории
      const categoryCheck = await client.query(
        'SELECT id FROM categories WHERE id = $1',
        [entity_id]
      );
      
      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Категория не найдена' });
      }
      
      // Вставка фото категории
      const result = await client.query(
        `INSERT INTO category_photos (category_id, photo_url, is_primary, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id, category_id, photo_url, is_primary`,
        [entity_id, fileUrl, is_primary === 'true', 0]
      );
      
      res.json({
        success: true,
        photo: result.rows[0],
        url: fileUrl
      });
      
    } else {
      return res.status(400).json({ error: 'Неверный тип сущности. Используйте "product" или "category"' });
    }
    
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Ошибка загрузки фото' });
  } finally {
    client.release();
  }
});

// GET /api/products/:id/photos - получить фото товара
router.get('/products/:id/photos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, photo_url, is_primary, sort_order FROM product_photos WHERE product_id = $1 ORDER BY sort_order, is_primary DESC',
      [id]
    );
    
    res.json({
      success: true,
      photos: result.rows
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Ошибка получения фото' });
  }
});

// GET /api/categories/:id/photos - получить фото категории
router.get('/categories/:id/photos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, photo_url, is_primary, sort_order FROM category_photos WHERE category_id = $1 ORDER BY sort_order, is_primary DESC',
      [id]
    );
    
    res.json({
      success: true,
      photos: result.rows
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Ошибка получения фото' });
  }
});

export default router;