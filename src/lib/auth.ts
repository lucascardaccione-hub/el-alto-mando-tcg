import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'el-alto-mando-tcg-super-secret-key-2024';
const COOKIE_NAME = 'altomando_session';

export interface UserSession {
  id: number;
  username: string;
  email?: string;
  role: string;
  is_verified?: number;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}

export function getCurrentUser(): UserSession | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Check user is still active in database
    const stmt = db.prepare('SELECT id, username, email, role, is_active, is_verified FROM users WHERE id = ?');
    const user = stmt.get(decoded.id) as {
      id: number;
      username: string;
      email: string;
      role: string;
      is_active: number;
      is_verified: number;
    } | undefined;

    if (!user || user.is_active !== 1) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
    };
  } catch (e) {
    return null;
  }
}

export { COOKIE_NAME };
