/**
 * Purchase Orders Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createPO, listPOs, getPOById, confirmPO } from '../controllers/poController';

const router = Router();

// All PO routes require authentication
router.use(authMiddleware);

router.post('/', createPO);
router.get('/', listPOs);
router.get('/:id', getPOById);
router.put('/:id/confirm', confirmPO);

export default router;
