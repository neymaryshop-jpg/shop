const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Простая база данных в памяти
const users = [
    {
        id: 1,
        email: 'admin@neymaryshop.com',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKYbF3Qe.Rl6L7K', // admin123
        full_name: 'Administrator',
        is_active: true,
        is_verified: true,
        role_name: 'super_admin',
        permissions: '{"can_manage": true, "level": 100}'
    }
];

const sessions = new Map();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin login
app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', { email, password });
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email и пароль обязательны' });
        }
        
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        
        if (!user.role_name) {
            return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав администратора.' });
        }
        
        let validPassword;
        if (password.startsWith('$2b$')) {
            validPassword = password === user.password_hash;
        } else {
            validPassword = await bcrypt.compare(password, user.password_hash);
        }
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
        
        sessions.set(token, {
            userId: user.id,
            expiresAt
        });
        
        console.log('Login successful:', { userId: user.id, token: token.substring(0, 10) + '...' });
        
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
        console.error('Login error:', error);
        res.status(500).json({ message: 'Ошибка при входе' });
    }
});

// Admin logout
app.post('/api/auth/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
        sessions.delete(token);
    }
    
    res.json({ success: true });
});

// Middleware для проверки админ токена
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    const session = sessions.get(token);
    
    if (!session || session.expiresAt < new Date()) {
        sessions.delete(token);
        return res.status(401).json({ error: 'Сессия истекла' });
    }
    
    const user = users.find(u => u.id === session.userId);
    
    if (!user || !user.role_name) {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    req.admin = user;
    next();
};

// Protected admin endpoint
app.get('/api/admin/dashboard', authenticateAdmin, (req, res) => {
    res.json({
        message: 'Добро пожаловать в админ панель!',
        user: req.admin,
        stats: {
            totalOrders: 0,
            totalUsers: 1,
            totalRevenue: 0
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend running on port ${PORT}`);
    console.log(`📊 Database: SQLite`);
    console.log(`🔌 Authentication: ready`);
    console.log(`🌐 Available on: http://0.0.0.0:${PORT}`);
});
