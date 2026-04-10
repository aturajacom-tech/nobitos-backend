/**
 * Stock Controller
 */

import { Request, Response } from 'express';
import * as stockService from '../services/stockService';
import { ApiResponse, parsePaginationParams } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const getCurrentStock = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const stock = await stockService.getCurrentStock(req.user.organization_id);

  res.status(200).json({ status: 'success', data: stock } as ApiResponse);
});

export const getStockHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const params = parsePaginationParams(req.query);
  const result = await stockService.getStockHistory(req.user.organization_id, params);

  res.status(200).json({
    status: 'success',
    data: {
      items: result.items,
      total: result.total,
      page: params.page,
      per_page: params.per_page,
      total_pages: Math.ceil(result.total / params.per_page)
    }
  } as ApiResponse);
});

export const getItemHistory = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.params;
  if (!req.user) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  const history = await stockService.getItemStockHistory(itemId, req.user.organization_id);

  res.status(200).json({ status: 'success', data: history } as ApiResponse);
});
