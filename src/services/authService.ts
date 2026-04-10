/**
 * Authentication Service
 * User registration, login using Supabase PostgreSQL
 */

import bcryptjs from 'bcryptjs';
import { generateToken } from '../config/jwt';
import { getDatabase } from '../config/database';
import { User, JWTPayload, RoleType, APIError, RegisterRequest, LoginRequest, AuthResponse } from '../types';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcryptjs.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcryptjs.compare(password, hash);
  } catch {
    return false;
  }
}

export async function registerUser(req: RegisterRequest): Promise<AuthResponse> {
  if (!req.email || !req.password || !req.full_name) {
    throw new APIError(400, 'INVALID_INPUT', 'Email, password, and full_name are required');
  }

  if (req.password.length < 8) {
    throw new APIError(400, 'WEAK_PASSWORD', 'Password must be at least 8 characters');
  }

  const db = getDatabase();

  // Check if email already exists
  const existing = await db`SELECT id FROM users WHERE email = ${req.email} LIMIT 1`;
  if (existing.length > 0) {
    throw new APIError(409, 'EMAIL_EXISTS', 'Email already registered');
  }

  const passwordHash = await hashPassword(req.password);

  // Use provided organization_id or find default organization
  let organizationId = req.organization_id;
  if (!organizationId) {
    const defaultOrg = await db`SELECT id FROM organizations WHERE type = 'gudang_pusat' LIMIT 1`;
    organizationId = defaultOrg.length > 0 ? defaultOrg[0].id : null;
  }

  const [newUser] = await db`
    INSERT INTO users (email, password_hash, full_name, role, organization_id)
    VALUES (${req.email}, ${passwordHash}, ${req.full_name}, ${req.role || RoleType.GUDANG_PUSAT}, ${organizationId})
    RETURNING id, email, full_name, role, organization_id, created_at
  `;

  return {
    user_id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name,
    role: newUser.role,
    organization_id: newUser.organization_id,
    created_at: newUser.created_at
  };
}

export async function loginUser(req: LoginRequest): Promise<AuthResponse> {
  if (!req.email || !req.password) {
    throw new APIError(400, 'INVALID_INPUT', 'Email and password required');
  }

  const db = getDatabase();

  const users = await db`
    SELECT id, email, full_name, role, organization_id, password_hash
    FROM users
    WHERE email = ${req.email}
    LIMIT 1
  `;

  if (users.length === 0) {
    throw new APIError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const user = users[0];

  const passwordValid = await comparePassword(req.password, user.password_hash);
  if (!passwordValid) {
    throw new APIError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    user_id: user.id,
    email: user.email,
    role: user.role,
    organization_id: user.organization_id
  };

  const token = generateToken(payload);

  return {
    user_id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    organization_id: user.organization_id,
    token,
    expires_in: 86400,
    token_type: 'Bearer'
  };
}

export async function logoutUser(userId: string): Promise<void> {
  // JWT-based auth — logout handled client-side; this is for audit purposes only
}

export async function getUserById(userId: string): Promise<User | null> {
  const db = getDatabase();
  const users = await db`
    SELECT id, email, full_name, role, organization_id, created_at, updated_at
    FROM users WHERE id = ${userId} LIMIT 1
  `;
  return users.length > 0 ? (users[0] as User) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDatabase();
  const users = await db`
    SELECT id, email, full_name, role, organization_id, created_at, updated_at
    FROM users WHERE email = ${email} LIMIT 1
  `;
  return users.length > 0 ? (users[0] as User) : null;
}
