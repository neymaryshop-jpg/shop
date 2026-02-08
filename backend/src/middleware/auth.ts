import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role_name: string;
  permissions: any;
}

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!adminToken) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT u.id, u.email, u.full_name, ar.role_name, ar.permissions
         FROM users u
         JOIN admin_sessions s ON u.id = s.user_id
         LEFT JOIN admin_roles ar ON u.id = ar.user_id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [adminToken]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Сессия истекла' });
      }

      const user = result.rows[0];
      
      if (!user.role_name) {
        return res.status(403).json({ error: 'Доступ запрещен. У вас нет прав администратора.' });
      }

      (req as any).admin = user;
      next();

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
};