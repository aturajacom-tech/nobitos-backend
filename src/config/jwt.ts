/**
 * JWT Configuration
 * Token generation and verification
 */

import jwt from 'jsonwebtoken';
import { JWTPayload, RoleType } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload as Record<string, unknown>, JWT_SECRET as string, {
    expiresIn: JWT_EXPIRY
  } as any);
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET as string) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(): number {
  return 24 * 60 * 60; // 24 hours in seconds
}
