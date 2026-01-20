import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class SecurityMiddleware {
    private pool: Pool;
    private readonly SALT_ROUNDS = 12;
    private readonly MAX_LOGIN_ATTEMPTS = 5;
    private readonly BLOCK_TIME_MINUTES = 15;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    // Хэширование пароля с bcrypt (более безопасно чем SHA-256)
    async hashPassword(password: string): Promise<string> {
        if (!this.validatePasswordComplexity(password)) {
            throw new Error('Пароль не соответствует требованиям безопасности');
        }
        return await bcrypt.hash(password, this.SALT_ROUNDS);
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    private validatePasswordComplexity(password: string): boolean {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const noRepeating = !/(.)\1{2,}/.test(password); // Не более 2 повторяющихся символов

        return password.length >= minLength && 
               hasUpperCase && 
               hasLowerCase && 
               hasNumbers && 
               hasSpecial &&
               noRepeating;
    }

    // Проверка IP на блокировку
    async checkIpBlock(ip: string): Promise<boolean> {
        const result = await this.pool.query(
            'SELECT block_until FROM ip_blocks WHERE ip_address = $1 AND block_until > NOW()',
            [ip]
        );
        return result.rows.length > 0;
    }

    // Регистрация события безопасности
    async logSecurityEvent(
        userId: number | null, 
        eventType: string, 
        ip: string, 
        userAgent: string, 
        details: any = null
    ) {
        try {
            await this.pool.query(
                `INSERT INTO security_events 
                 (user_id, event_type, ip_address, user_agent, details) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, eventType, ip, userAgent, JSON.stringify(details)]
            );
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    // Проверка rate limit для различных действий
    async checkRateLimit(key: string, type: string, maxAttempts: number, windowMinutes: number): Promise<boolean> {
        const now = new Date();
        const windowStart = new Date(now.getTime() - windowMinutes * 60000);

        try {
            const result = await this.pool.query(
                `INSERT INTO enhanced_rate_limits (key, type, attempts, first_attempt, last_attempt)
                 VALUES ($1, $2, 1, $3, $3)
                 ON CONFLICT (key, type) 
                 DO UPDATE SET 
                    attempts = CASE 
                        WHEN enhanced_rate_limits.first_attempt > $4 THEN 1
                        ELSE enhanced_rate_limits.attempts + 1
                    END,
                    last_attempt = $3,
                    first_attempt = CASE 
                        WHEN enhanced_rate_limits.first_attempt > $4 THEN $3
                        ELSE enhanced_rate_limits.first_attempt
                    END,
                    blocked_until = CASE 
                        WHEN enhanced_rate_limits.attempts >= $5 THEN $3 + INTERVAL '15 minutes'
                        ELSE enhanced_rate_limits.blocked_until
                    END
                 RETURNING attempts, blocked_until`,
                [key, type, now, windowStart, maxAttempts]
            );

            if (result.rows[0].blocked_until && result.rows[0].blocked_until > now) {
                return false; // Заблокирован
            }

            return result.rows[0].attempts <= maxAttempts;
        } catch (error) {
            console.error('Rate limit check error:', error);
            return true; // В случае ошибки пропускаем
        }
    }

    // Middleware для проверки безопасности
    securityCheck() {
        return async (req: Request, res: Response, next: NextFunction) => {
            const ip = req.ip || req.connection.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            // 1. Проверка IP на блокировку
            if (await this.checkIpBlock(ip)) {
                await this.logSecurityEvent(null, 'BLOCKED_IP_ACCESS', ip, userAgent);
                return res.status(429).json({ 
                    error: 'Ваш IP временно заблокирован из-за подозрительной активности' 
                });
            }

            // 2. Проверка rate limit для запросов
            const rateLimitKey = `ip_${ip}`;
            if (!await this.checkRateLimit(rateLimitKey, 'general', 100, 1)) {
                await this.logSecurityEvent(null, 'RATE_LIMIT_EXCEEDED', ip, userAgent);
                return res.status(429).json({ 
                    error: 'Слишком много запросов. Попробуйте позже.' 
                });
            }

            // 3. Защита от XSS - очистка входных данных
            if (req.body) {
                this.sanitizeInput(req.body);
            }
            if (req.query) {
                this.sanitizeInput(req.query);
            }

            // 4. Добавляем security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");

            next();
        };
    }

    private sanitizeInput(obj: any): any {
        if (!obj) return obj;

        if (typeof obj === 'string') {
            // Удаляем потенциально опасные символы
            return obj
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim();
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeInput(item));
        }

        if (typeof obj === 'object') {
            const sanitized: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = this.sanitizeInput(obj[key]);
                }
            }
            return sanitized;
        }

        return obj;
    }
}
