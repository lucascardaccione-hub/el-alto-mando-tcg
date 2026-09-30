import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'el-alto-mando-tcg-super-secret-key-2024';
const COOKIE_NAME = 'altomando_session';

export interface UserSession {
  id: number;
  username: string;
  email?: string;
  role: string;
  is_verified?: number;
  avatar_url?: string | null;
  phone?: string | null;
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

export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateResetToken(): string {
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

    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      is_verified: decoded.is_verified,
      avatar_url: decoded.avatar_url,
      phone: decoded.phone,
    };
  } catch (e) {
    return null;
  }
}

export { COOKIE_NAME };
