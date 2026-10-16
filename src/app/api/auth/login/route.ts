import { NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  comparePassword,
  createToken,
  COOKIE_NAME,
  createPendingVerifyToken,
  PENDING_VERIFY_COOKIE,
} from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { username, password } = await request.json();

    const identifier = (username || '').trim();
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Por favor ingresa tu usuario/email y contraseña' }, { status: 400 });
    }

    const rateKey = `login:${ip}:${identifier.toLowerCase()}`;
    const rate = checkRateLimit(rateKey, 8, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Demasiados intentos de inicio de sesión. Intenta nuevamente en ${Math.ceil(rate.retryAfterSeconds / 60)} minutos.`,
        },
        { status: 429 }
      );
    }

    const user = await db.get(
      'SELECT * FROM users WHERE (username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE)',
      [identifier, identifier]
    );

    if (!user) {
      recordFailedAttempt(rateKey);
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    if (user.is_active !== 1) {
      return NextResponse.json({ error: 'Usuario deshabilitado por el administrador' }, { status: 403 });
    }

    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      recordFailedAttempt(rateKey);
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    clearFailedAttempts(rateKey);

    // Check email verification (admin is always verified)
    if (user.role !== 'admin' && user.is_verified !== 1) {
      const pendingToken = createPendingVerifyToken({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      const response = NextResponse.json(
        {
          error: 'Debes verificar tu correo electrónico antes de iniciar sesión.',
          requires_verification: true,
          email: user.email,
        },
        { status: 403 }
      );

      response.cookies.set({
        name: PENDING_VERIFY_COOKIE,
        value: pendingToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2,
        path: '/',
      });

      return response;
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
