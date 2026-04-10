/**
 * Handover Controller
 */

import { Request, Response } from 'express';
import * as handoverService from '../services/handoverService';
import { logAction } from '../middleware/auditLog';
import { ApiResponse, APIError } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const createHandover = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const result = await handoverService.createHandover(req.body);

  await logAction(req.user.user_id, 'created', 'handover', result.handover_id, {}, req.clientIp);

  res.status(201).json({
    status: 'success',
    data: {
      handover_id: result.handover_id,
      sender_pin: result.sender_pin,
      receiver_pin: result.receiver_pin,
      message: 'Handover created. Share PINs with sender and receiver.'
    }
  } as ApiResponse);
});

export const verifyPin = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const { handoverId } = req.params;
  const { pin, verified_by } = req.body;

  if (!pin || !verified_by || !['sender', 'receiver'].includes(verified_by)) {
    throw new APIError(400, 'INVALID_INPUT', 'PIN and verified_by role required');
  }

  await handoverService.verifyHandoverPin(handoverId, pin, verified_by);

  await logAction(req.user.user_id, 'verified_pin', 'handover', handoverId, { verified_by }, req.clientIp);

  res.status(200).json({
    status: 'success',
    data: { message: 'PIN verified successfully' }
  } as ApiResponse);
});

export const getHandoverStatus = asyncHandler(async (req: Request, res: Response) => {
  const { handoverId } = req.params;
  const status = await handoverService.getHandoverStatus(handoverId);

  if (!status) {
    res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Handover not found' });
    return;
  }

  res.status(200).json({ status: 'success', data: status } as ApiResponse);
});
