/**
 * Delivery Orders Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createDelivery, listDeliveries, getDeliveryById, confirmDelivery } from '../controllers/deliveryController';

const router = Router();

router.use(authMiddleware);

router.post('/', createDelivery);
router.get('/', listDeliveries);
router.get('/:id', getDeliveryById);
router.put('/:id/confirm', confirmDelivery);

export default router;
