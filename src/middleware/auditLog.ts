/**
 * Audit Logging Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';

export async function logAction(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    const db = getDatabase();
    await db.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
      ip_address: ipAddress || null
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw — audit failure must not break the request
  }
}

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json;

  res.json = function (data: any) {
    if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
      const method = req.method;
      const path = req.path;

      let action = 'viewed';
      let entityType = 'api';

      if (method === 'POST') {
        action = 'created';
        if (path.includes('/purchase-orders')) entityType = 'purchase_order';
        else if (path.includes('/delivery-orders')) entityType = 'delivery_order';
        else if (path.includes('/handovers')) entityType = 'handover';
        else if (path.includes('/register')) entityType = 'user';
      } else if (method === 'PUT') {
        action = 'updated';
        if (path.includes('/confirm')) action = 'confirmed';
        if (path.includes('/verify-pin')) action = 'verified_pin';
      }

      logAction(
        req.user.user_id,
        action,
        entityType,
        undefined,
        { method, path, status: res.statusCode },
        req.clientIp
      ).catch(() => { /* silent */ });
    }

    return originalJson.call(this, data);
  };

  next();
}
