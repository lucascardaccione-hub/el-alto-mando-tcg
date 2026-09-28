import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, code, token } = await request.json();

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();
    const cleanToken = (token || '').trim();

    if (!cleanEmail && !cleanToken) {
      return NextResponse.json({ error: 'Email o token de verificación requerido' }, { status: 400 });
    }

    let user: any = null;

    if (cleanToken) {
      user = await db.get('SELECT * FROM users WHERE verification_token = ?', [cleanToken]);
    } else if (cleanEmail && cleanCode) {
      user = await db.get('SELECT * FROM users WHERE email = ? COLLATE NOCASE AND verification_code = ?', [cleanEmail, cleanCode]);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'El código o enlace de verificación es inválido o ha expirado.' },
        { status: 400 }
      );
    }

    // Check expiration if present
    if (user.verification_expires) {
      const expires = new Date(user.verification_expires).getTime();
      if (Date.now() > expires) {
        return NextResponse.json(
          { error: 'El código de verificación ha expirado. Por favor solicita uno nuevo.' },
          { status: 400 }
        );
      }
    }

    // Mark as verified and clear temporary token/code
    await db.run(`
      UPDATE users
      SET is_verified = 1, verification_token = NULL, verification_code = NULL, verification_expires = NULL
      WHERE id = ?
    `, [user.id]);

    // Auto-login the user
    const sessionToken = createToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_verified: 1,
    });

    const response = NextResponse.json({
      success: true,
      message: '¡Cuenta verificada exitosamente! Bienvenido a El Alto Mando TCG.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: 1,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Error al verificar la cuenta' }, { status: 500 });
  }
}
