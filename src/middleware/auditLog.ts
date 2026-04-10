/**
 * Audit Logging Middleware
 * Log all actions to audit_logs table
 */

import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';

interface AuditLogData {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
}

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
    await db`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (
        ${userId},
        ${action},
        ${entityType},
        ${entityId || null},
        ${details ? JSON.stringify(details) : null},
        ${ipAddress || null}
      )
    `;
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit log failure should not break the request
  }
}

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json;

  res.json = function (data: any) {
    // Log successful actions
    if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
      const method = req.method;
      const path = req.path;

      let action = 'unknown';
      let entityType = 'unknown';
      let entityId: string | undefined;

      // Infer action and entity from request
      if (method === 'POST') {
        action = 'created';
        if (path.includes('/register')) {
          entityType = 'user';
        } else if (path.includes('/purchase-orders')) {
          entityType = 'purchase_order';
        } else if (path.includes('/delivery-orders')) {
          entityType = 'delivery_order';
        } else if (path.includes('/handovers')) {
          entityType = 'handover';
        }
      } else if (method === 'PUT') {
        action = 'updated';
        const idMatch = path.match(/\/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/);
        if (idMatch) {
          entityId = idMatch[1];
        }
      } else if (method === 'GET') {
        action = 'viewed';
      }

      if (action !== 'unknown' && req.user) {
        logAction(
          req.user.user_id,
          action,
          entityType,
          entityId,
          { path, method, status: res.statusCode },
          req.ip
        ).catch(console.error);
      }
    }

    return originalJson.call(this, data);
  };

  next();
}
