/**
 * Role-Based Access Control (RBAC) Middleware
 * Permission enforcement per endpoint
 */

import { Request, Response, NextFunction } from 'express';
import { RoleType, APIError } from '../types';

// Role permissions matrix
const rolePermissions: Record<string, string[]> = {
  [RoleType.OFFICE_PUSAT]: ['read_po', 'create_po', 'confirm_po', 'read_stock', 'read_delivery', 'create_delivery'],
  [RoleType.GUDANG_PUSAT]: ['read_po', 'read_stock', 'read_delivery', 'confirm_delivery', 'create_handover', 'verify_handover'],
  [RoleType.SUPPLIER]: ['read_po', 'read_delivery'],
  [RoleType.KITCHEN_HEAD]: ['read_stock', 'read_delivery'],
  [RoleType.OUTLET_MANAGER]: ['read_po', 'read_stock', 'read_delivery'],
  [RoleType.HQ_MANAGEMENT]: ['read_po', 'read_stock', 'read_delivery', 'read_audit', 'read_analytics']
};

export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const userPermissions = rolePermissions[req.user.role] || [];
    const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
      });
      return;
    }

    next();
  };
}

export function requireRole(...allowedRoles: RoleType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Access denied. Allowed roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

export function checkRBAC(role: RoleType, permission: string): boolean {
  const userPermissions = rolePermissions[role] || [];
  return userPermissions.includes(permission);
}
