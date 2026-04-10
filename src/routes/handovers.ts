/**
 * Handover Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createHandover, verifyPin, getHandoverStatus } from '../controllers/handoverController';

const router = Router();

router.use(authMiddleware);

router.post('/', createHandover);
router.get('/:handoverId', getHandoverStatus);
router.post('/:handoverId/verify-pin', verifyPin);

export default router;
