/**
 * Delivery Order Controller
 */

import { Request, Response } from 'express';
import * as deliveryService from '../services/deliveryService';
import { logAction } from '../middleware/auditLog';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const createDelivery = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const delivery = await deliveryService.createDeliveryOrder(req.body, req.user.user_id);

  await logAction(req.user.user_id, 'created', 'delivery_order', delivery.id, { delivery_number: delivery.delivery_number }, req.clientIp);

  res.status(201).json({ status: 'success', data: delivery } as ApiResponse);
});

export const listDeliveries = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const deliveries = await deliveryService.listDeliveryOrders(req.user.organization_id, req.query.status as string);

  res.status(200).json({ status: 'success', data: deliveries } as ApiResponse);
});

export const getDeliveryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const delivery = await deliveryService.getDeliveryById(id);

  if (!delivery) {
    res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Delivery order not found' });
    return;
  }

  res.status(200).json({ status: 'success', data: delivery } as ApiResponse);
});

export const confirmDelivery = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const { id } = req.params;
  const delivery = await deliveryService.confirmDeliveryReceipt(id);

  await logAction(req.user.user_id, 'confirmed', 'delivery_order', delivery.id, {}, req.clientIp);

  res.status(200).json({ status: 'success', data: delivery } as ApiResponse);
});
