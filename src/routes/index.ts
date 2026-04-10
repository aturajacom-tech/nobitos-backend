/**
 * Route Aggregator
 * Combine all routes into main router
 */

import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import purchaseOrderRoutes from './purchaseOrders';
import stockRoutes from './stock';
import deliveryOrderRoutes from './deliveryOrders';
import handoverRoutes from './handovers';

const router = Router();

// Health check (public)
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      message: 'API is healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

// Auth routes (public: register, login)
router.use('/auth', authRoutes);

// Protected routes
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/stock', stockRoutes);
router.use('/delivery-orders', deliveryOrderRoutes);
router.use('/handovers', handoverRoutes);

export default router;
