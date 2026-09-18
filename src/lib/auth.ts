import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import pool, { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'scopereceipt-super-secret-key-2026-prod';
export const AUTH_COOKIE_NAME = 'sr_auth_token';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  credits: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Hash a plain text password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare plain password with stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Sign a stateless JWT for freelancer authentication
 */
export function signAuthToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verify and decode JWT token
 */
export function verifyAuthToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user from cookies or Authorization header
 * Fetches real-time credit balance from MySQL database
 */
export async function getAuthUser(req?: Request): Promise<AuthUser | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }
    }
  }

  // Fallback to Next.js cookies() API
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Ignore if called outside server request context
    }
  }

  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const rows = await query<any[]>('SELECT id, name, email, credits FROM users WHERE id = ?', [payload.userId]);
    if (rows && rows.length > 0) {
      return {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        credits: Number(rows[0].credits || 0),
      };
    }
  } catch (err) {
    console.error('[getAuthUser] Error fetching user:', err);
  }

  return null;
}
