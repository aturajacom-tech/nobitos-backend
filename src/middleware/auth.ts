/**
 * Authentication Middleware
 * JWT verification and user context
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { JWTPayload, AuthenticatedRequest, APIError } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      token?: string;
      clientIp?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError(401, 'MISSING_TOKEN', 'Authorization header missing or invalid');
    }

    const token = authHeader.substring(7);
    req.token = token;
    req.user = verifyToken(token);
    req.clientIp = req.ip || req.socket.remoteAddress || '';

    next();
  } catch (error) {
    if (error instanceof APIError) {
      res.status(error.statusCode).json({
        status: 'error',
        code: error.code,
        message: error.message
      });
    } else {
      res.status(401).json({
        status: 'error',
        code: 'AUTH_FAILED',
        message: 'Authentication failed'
      });
    }
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.token = token;
      req.user = verifyToken(token);
    }

    req.clientIp = req.ip || req.socket.remoteAddress || '';
    next();
  } catch {
    // If auth fails, continue without user context
    req.clientIp = req.ip || req.socket.remoteAddress || '';
    next();
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'User authentication required'
    });
    return;
  }

  next();
}
