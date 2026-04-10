/**
 * Authentication Service — Supabase client version
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

  // Check email uniqueness
  const { data: existing } = await db.from('users').select('id').eq('email', req.email).limit(1);
  if (existing && existing.length > 0) {
    throw new APIError(409, 'EMAIL_EXISTS', 'Email already registered');
  }

  // Resolve organization
  let organizationId = req.organization_id;
  if (!organizationId) {
    const { data: orgs } = await db.from('organizations').select('id').eq('type', 'gudang_pusat').limit(1);
    organizationId = orgs && orgs.length > 0 ? orgs[0].id : null;
  }

  const passwordHash = await hashPassword(req.password);

  const { data: newUser, error } = await db
    .from('users')
    .insert({
      email: req.email,
      password_hash: passwordHash,
      full_name: req.full_name,
      role: req.role || RoleType.GUDANG_PUSAT,
      organization_id: organizationId
    })
    .select('id, email, full_name, role, organization_id, created_at')
    .single();

  if (error || !newUser) {
    throw new APIError(500, 'REGISTRATION_ERROR', error?.message || 'Registration failed');
  }

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

  const { data: users, error } = await db
    .from('users')
    .select('id, email, full_name, role, organization_id, password_hash')
    .eq('email', req.email)
    .limit(1);

  if (error) throw new APIError(500, 'DB_ERROR', error.message);
  if (!users || users.length === 0) {
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

export async function logoutUser(_userId: string): Promise<void> {
  // JWT-based — client removes token
}

export async function getUserById(userId: string): Promise<User | null> {
  const db = getDatabase();
  const { data } = await db
    .from('users')
    .select('id, email, full_name, role, organization_id, created_at, updated_at')
    .eq('id', userId)
    .single();
  return data as User | null;
}
