import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateResetCode, generateResetToken } from '@/lib/auth';
import { sendPasswordResetEmail, maskEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    const cleanId = (identifier || '').trim();

    if (!cleanId) {
      return NextResponse.json({ error: 'Por favor ingresa tu usuario o correo electrónico.' }, { status: 400 });
    }

    const user = await db.get(
      'SELECT id, username, email, is_active FROM users WHERE (email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE)',
      [cleanId, cleanId]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'No encontramos ninguna cuenta asociada a este usuario o correo.' },
        { status: 404 }
      );
    }

    if (user.is_active !== 1) {
      return NextResponse.json(
        { error: 'Esta cuenta ha sido deshabilitada por el administrador.' },
        { status: 403 }
      );
    }

    const code = generateResetCode();
    const token = generateResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await db.run(
      'UPDATE users SET reset_code = ?, reset_token = ?, reset_expires = ? WHERE id = ?',
      [code, token, expires, user.id]
    );

    // Send email with recovery code
    await sendPasswordResetEmail({
      to: user.email,
      username: user.username,
      code,
      token,
    });

    return NextResponse.json({
      success: true,
      message: 'Hemos enviado un código de 6 dígitos a tu correo electrónico para restablecer tu contraseña.',
      email: user.email,
      maskedEmail: maskEmail(user.email),
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Error al procesar la recuperación de contraseña.' }, { status: 500 });
  }
}
