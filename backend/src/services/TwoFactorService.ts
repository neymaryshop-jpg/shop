import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { Pool } from 'pg';

export class TwoFactorService {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    // Генерация нового секрета 2FA
    async generateSecret(userId: number, username: string): Promise<{
        secret: string;
        qrCodeUrl: string;
        backupCodes: string[];
    }> {
        const secret = speakeasy.generateSecret({
            name: `NeymaryShop:${username}`,
            length: 20
        });

        // Генерация 8 backup кодов
        const backupCodes = Array.from({ length: 8 }, () =>
            crypto.randomBytes(6).toString('hex').toUpperCase()
        );

        // Сохраняем временный секрет в таблицу two_factor_sessions
        await this.pool.query(
            `INSERT INTO two_factor_sessions 
             (user_id, secret_temp, backup_codes_temp, expires_at)
             VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
            [userId, secret.base32, backupCodes]
        );

        // Генерация QR кода
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        return {
            secret: secret.base32,
            qrCodeUrl,
            backupCodes
        };
    }

    // Верификация TOTP кода
    async verifyTotpCode(userId: number, token: string): Promise<boolean> {
        try {
            // Получаем секрет пользователя
            const result = await this.pool.query(
                'SELECT totp_secret FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0 || !result.rows[0].totp_secret) {
                return false;
            }

            const secret = result.rows[0].totp_secret;

            return speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: 1 // Допуск ±30 секунд
            });
        } catch (error) {
            console.error('TOTP verification error:', error);
            return false;
        }
    }

    // Верификация backup кода
    async verifyBackupCode(userId: number, code: string): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Получаем backup коды пользователя
            const result = await client.query(
                'SELECT backup_codes FROM users WHERE id = $1 FOR UPDATE',
                [userId]
            );

            if (result.rows.length === 0 || !result.rows[0].backup_codes) {
                await client.query('ROLLBACK');
                return false;
            }

            let backupCodes = result.rows[0].backup_codes;
            const index = backupCodes.indexOf(code);

            if (index === -1) {
                await client.query('ROLLBACK');
                return false;
            }

            // Удаляем использованный код
            backupCodes.splice(index, 1);

            // Обновляем backup коды в базе
            await client.query(
                'UPDATE users SET backup_codes = $1 WHERE id = $2',
                [backupCodes, userId]
            );

            // Логируем использование backup кода
            await client.query(
                `INSERT INTO security_events 
                 (user_id, event_type, details)
                 VALUES ($1, $2, $3)`,
                [userId, 'BACKUP_CODE_USED', JSON.stringify({ code })]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Backup code verification error:', error);
            return false;
        } finally {
            client.release();
        }
    }

    // Активация 2FA после верификации первого кода
    async enableTwoFactor(
        userId: number, 
        tempSessionId: string, 
        verificationCode: string
    ): Promise<{ success: boolean; backupCodes?: string[] }> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Получаем временную сессию
            const sessionResult = await client.query(
                `SELECT secret_temp, backup_codes_temp 
                 FROM two_factor_sessions 
                 WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
                [tempSessionId, userId]
            );

            if (sessionResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return { success: false };
            }

            const { secret_temp, backup_codes_temp } = sessionResult.rows[0];

            // Проверяем verification code
            const isValid = speakeasy.totp.verify({
                secret: secret_temp,
                encoding: 'base32',
                token: verificationCode,
                window: 1
            });

            if (!isValid) {
                await client.query('ROLLBACK');
                return { success: false };
            }

            // Активируем 2FA для пользователя
            await client.query(
                `UPDATE users 
                 SET totp_secret = $1, 
                     backup_codes = $2, 
                     totp_enabled = true,
                     updated_at = NOW()
                 WHERE id = $3`,
                [secret_temp, backup_codes_temp, userId]
            );

            // Удаляем временную сессию
            await client.query(
                'DELETE FROM two_factor_sessions WHERE id = $1',
                [tempSessionId]
            );

            // Логируем активацию 2FA
            await client.query(
                `INSERT INTO security_events 
                 (user_id, event_type, details)
                 VALUES ($1, $2, $3)`,
                [userId, '2FA_ENABLED', JSON.stringify({ method: 'TOTP' })]
            );

            await client.query('COMMIT');

            return { 
                success: true, 
                backupCodes: backup_codes_temp 
            };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Enable 2FA error:', error);
            return { success: false };
        } finally {
            client.release();
        }
    }

    // Отключение 2FA (требуется backup код или пароль)
    async disableTwoFactor(
        userId: number, 
        verificationMethod: 'backup_code' | 'password',
        verificationValue: string
    ): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            let isValid = false;

            if (verificationMethod === 'backup_code') {
                // Проверяем backup код
                const result = await client.query(
                    'SELECT backup_codes FROM users WHERE id = $1 FOR UPDATE',
                    [userId]
                );

                if (result.rows.length > 0 && result.rows[0].backup_codes) {
                    const backupCodes = result.rows[0].backup_codes;
                    const index = backupCodes.indexOf(verificationValue);
                    
                    if (index !== -1) {
                        isValid = true;
                        backupCodes.splice(index, 1);
                        
                        // Обновляем backup коды
                        await client.query(
                            'UPDATE users SET backup_codes = $1 WHERE id = $2',
                            [backupCodes, userId]
                        );
                    }
                }
            } else {
                // Проверяем пароль (нужна логика проверки пароля)
                // Здесь предполагается, что пароль уже проверен на уровне выше
                isValid = true;
            }

            if (!isValid) {
                await client.query('ROLLBACK');
                return false;
            }

            // Отключаем 2FA
            await client.query(
                `UPDATE users 
                 SET totp_secret = NULL, 
                     backup_codes = NULL, 
                     totp_enabled = false,
                     updated_at = NOW()
                 WHERE id = $1`,
                [userId]
            );

            // Логируем отключение
            await client.query(
                `INSERT INTO security_events 
                 (user_id, event_type, details)
                 VALUES ($1, $2, $3)`,
                [userId, '2FA_DISABLED', JSON.stringify({ method: verificationMethod })]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Disable 2FA error:', error);
            return false;
        } finally {
            client.release();
        }
    }

    // Генерация новых backup кодов
    async regenerateBackupCodes(userId: number): Promise<string[] | null> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Проверяем, что 2FA включена
            const userResult = await client.query(
                'SELECT totp_enabled FROM users WHERE id = $1 FOR UPDATE',
                [userId]
            );

            if (userResult.rows.length === 0 || !userResult.rows[0].totp_enabled) {
                await client.query('ROLLBACK');
                return null;
            }

            // Генерируем новые backup коды
            const newBackupCodes = Array.from({ length: 8 }, () =>
                crypto.randomBytes(6).toString('hex').toUpperCase()
            );

            // Обновляем backup коды
            await client.query(
                'UPDATE users SET backup_codes = $1, updated_at = NOW() WHERE id = $2',
                [newBackupCodes, userId]
            );

            // Логируем действие
            await client.query(
                `INSERT INTO security_events 
                 (user_id, event_type, details)
                 VALUES ($1, $2, $3)`,
                [userId, 'BACKUP_CODES_REGENERATED', JSON.stringify({ count: newBackupCodes.length })]
            );

            await client.query('COMMIT');
            return newBackupCodes;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Regenerate backup codes error:', error);
            return null;
        } finally {
            client.release();
        }
    }
}
