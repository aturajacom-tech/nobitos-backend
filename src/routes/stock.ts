/**
 * Stock Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getCurrentStock, getStockHistory, getItemHistory } from '../controllers/stockController';

const router = Router();

router.use(authMiddleware);

router.get('/current', getCurrentStock);
router.get('/history', getStockHistory);
router.get('/history/:itemId', getItemHistory);

export default router;
