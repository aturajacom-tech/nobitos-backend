/**
 * Authentication Routes
 */

import { Router } from 'express';
import { register, login, logout } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

// Protected routes
router.post('/logout', authMiddleware, asyncHandler(logout));

export default router;
