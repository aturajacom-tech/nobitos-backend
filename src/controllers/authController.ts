/**
 * Authentication Controller
 * Handle register, login, logout endpoints
 */

import { Request, Response } from 'express';
import { registerUser, loginUser, logoutUser } from '../services/authService';
import { logAction } from '../middleware/auditLog';
import { APIError, ApiResponse } from '../types';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = await registerUser(req.body);

    // Log action
    await logAction(
      result.user_id,
      'registered',
      'user',
      result.user_id,
      { email: result.email },
      req.ip
    );

    res.status(201).json({
      status: 'success',
      data: result
    } as ApiResponse);
  } catch (error) {
    if (error instanceof APIError) {
      res.status(error.statusCode).json({
        status: 'error',
        code: error.code,
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        code: 'REGISTRATION_FAILED',
        message: 'Registration failed'
      });
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const result = await loginUser(req.body);

    // Log action
    await logAction(
      result.user_id,
      'logged_in',
      'user',
      result.user_id,
      { email: result.email },
      req.ip
    );

    res.status(200).json({
      status: 'success',
      data: result
    } as ApiResponse);
  } catch (error) {
    if (error instanceof APIError) {
      res.status(error.statusCode).json({
        status: 'error',
        code: error.code,
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        code: 'LOGIN_FAILED',
        message: 'Login failed'
      });
    }
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
      return;
    }

    await logoutUser(req.user.user_id);

    // Log action
    await logAction(
      req.user.user_id,
      'logged_out',
      'user',
      req.user.user_id,
      {},
      req.ip
    );

    res.status(200).json({
      status: 'success',
      data: { message: 'Logged out successfully' }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      code: 'LOGOUT_FAILED',
      message: 'Logout failed'
    });
  }
}

export async function healthCheck(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'success',
    data: {
      message: 'Server is healthy',
      timestamp: new Date().toISOString()
    }
  } as ApiResponse);
}
