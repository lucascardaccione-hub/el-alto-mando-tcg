import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, code, token, newPassword } = await request.json();

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();
    const cleanToken = (token || '').trim();
    const cleanPassword = (newPassword || '').trim();

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    if (!cleanToken && (!cleanEmail || !cleanCode)) {
      return NextResponse.json(
        { error: 'Debes proporcionar el código de 6 dígitos o el enlace de recuperación.' },
        { status: 400 }
      );
    }

    let user: any = null;

    if (cleanToken) {
      user = await db.get('SELECT * FROM users WHERE reset_token = ?', [cleanToken]);
    } else if (cleanEmail && cleanCode) {
      user = await db.get(
        'SELECT * FROM users WHERE email = ? COLLATE NOCASE AND reset_code = ?',
        [cleanEmail, cleanCode]
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'El código o enlace de recuperación es inválido o ha expirado.' },
        { status: 400 }
      );
    }

    if (user.reset_expires) {
      const expires = new Date(user.reset_expires).getTime();
      if (Date.now() > expires) {
        return NextResponse.json(
          { error: 'El código de recuperación ha expirado. Por favor solicita uno nuevo.' },
          { status: 400 }
        );
      }
    }

    const hashed = hashPassword(cleanPassword);

    await db.run(
      `UPDATE users 
       SET password_hash = ?, reset_token = NULL, reset_code = NULL, reset_expires = NULL, is_verified = 1 
       WHERE id = ?`,
      [hashed, user.id]
    );

    return NextResponse.json({
      success: true,
      message: '¡Tu contraseña ha sido restablecida exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Error al restablecer la contraseña.' }, { status: 500 });
  }
}
