/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

import { Request, Response, NextFunction } from 'express';
import { APIError } from '../types';

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('[ERROR]', error.message, error.stack);

  if (error instanceof APIError) {
    res.status(error.statusCode).json({
      status: 'error',
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details })
    });
    return;
  }

  // Default error response
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.path}`
  });
}

// Wrapper for async route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
