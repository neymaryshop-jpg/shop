/**
 * Middleware для логирования действий пользователей
 * Логирование в файл и консоль
 */
import * as fs from 'fs';
import * as path from 'path';
import { Request, Response, NextFunction } from 'express';

// Создаём директорию для логов
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Файл лога на сегодня
const today = new Date().toISOString().split('T')[0];
const logFile = path.join(logsDir, `website_${today}.log`);

// Функция записи в лог
export function writeLog(level: string, message: string, meta: Record<string, any> = {}): void {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    level,
    message,
    ...meta
  }) + '\n';

  // Пишем в файл
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error('Ошибка записи лога:', err);
  });

  // Пишем в консоль
  const consoleMsg = `${timestamp} - [${level}] ${message} ${JSON.stringify(meta)}`;
  if (level === 'INFO') console.log(consoleMsg);
  if (level === 'WARN') console.warn(consoleMsg);
  if (level === 'ERROR') console.error(consoleMsg);
}

// Middleware для логирования HTTP запросов
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const userId = (req as any).user?.id || (req as any).session?.userId || 'anonymous';
  const ip = req.ip || (req.connection as any)?.remoteAddress;

  // Логирование после завершения запроса
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData: Record<string, any> = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId,
      ip
    };

    // Игнорируем статику и favicon
    if (!req.originalUrl.includes('.') && req.originalUrl !== '/favicon.ico') {
      writeLog('INFO', 'HTTP Request', logData);
    }
  });

  next();
}

// Middleware для логирования действий пользователя
export function userActionLogger(actionType: string): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id || (req as any).session?.userId || 'anonymous';
    const userAgent = req.get('user-agent') || 'unknown';

    // Перехватываем отправку данных
    const originalJson = res.json;
    res.json = function(data: any) {
      writeLog('INFO', `User Action: ${actionType}`, {
        userId,
        action: actionType,
        body: req.body ? Object.keys(req.body) : null,
        response: typeof data === 'object' ? Object.keys(data) : null,
        userAgent
      });
      return originalJson.call(this, data);
    };

    next();
  };
}

// Логирование ошибок
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction): void {
  const userId = (req as any).user?.id || 'anonymous';

  writeLog('ERROR', 'Server Error', {
    userId,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  next(err);
}

// Логирование аутентификации
export function authLogger(action: string): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const email = req.body?.email || 'unknown';
    const ip = req.ip || (req.connection as any)?.remoteAddress;

    const originalJson = res.json;
    res.json = function(data: any) {
      writeLog('INFO', `Auth: ${action}`, {
        email,
        ip,
        success: data?.success || res.statusCode < 400,
        userId: data?.user?.id || null
      });
      return originalJson.call(this, data);
    };

    next();
  };
}
