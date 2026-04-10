/**
 * Purchase Order Controller
 */

import { Request, Response } from 'express';
import * as poService from '../services/poService';
import { logAction } from '../middleware/auditLog';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const createPO = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const po = await poService.createPurchaseOrder(req.body, req.user.user_id);

  await logAction(req.user.user_id, 'created', 'purchase_order', po.id, { po_number: po.po_number }, req.clientIp);

  res.status(201).json({ status: 'success', data: po } as ApiResponse);
});

export const listPOs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const pos = await poService.listPurchaseOrders(req.user.organization_id, req.query.status as any);

  res.status(200).json({ status: 'success', data: pos } as ApiResponse);
});

export const getPOById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const po = await poService.getPurchaseOrderById(id);

  if (!po) {
    res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Purchase order not found' });
    return;
  }

  res.status(200).json({ status: 'success', data: po } as ApiResponse);
});

export const confirmPO = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const { id } = req.params;
  const po = await poService.confirmPurchaseOrder(id);

  await logAction(req.user.user_id, 'confirmed', 'purchase_order', po.id, {}, req.clientIp);

  res.status(200).json({ status: 'success', data: po } as ApiResponse);
});
