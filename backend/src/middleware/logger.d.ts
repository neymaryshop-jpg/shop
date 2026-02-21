/**
 * Type definitions for logger middleware
 */

import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void;
export function userActionLogger(actionType: string): (req: Request, res: Response, next: NextFunction) => void;
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction): void;
export function authLogger(action: string): (req: Request, res: Response, next: NextFunction) => void;
export function writeLog(level: string, message: string, meta?: Record<string, any>): void;
