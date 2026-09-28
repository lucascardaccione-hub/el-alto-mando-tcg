import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, createToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, identifier, password } = await request.json();
    const loginId = (identifier || username || '').trim();

    if (!loginId || !password) {
      return NextResponse.json({ error: 'Usuario/email y contraseña requeridos' }, { status: 400 });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE (username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE)');
    const user = stmt.get(loginId, loginId) as any;

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    if (user.is_active !== 1) {
      return NextResponse.json({ error: 'Usuario deshabilitado por el administrador' }, { status: 403 });
    }

    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Check email verification (admin is always verified)
    if (user.role !== 'admin' && user.is_verified !== 1) {
      return NextResponse.json(
        {
          error: 'Debes verificar tu correo electrónico antes de iniciar sesión.',
          requires_verification: true,
          email: user.email,
          verification_code: process.env.NODE_ENV !== 'production' ? user.verification_code : undefined,
        },
        { status: 403 }
      );
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
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}
