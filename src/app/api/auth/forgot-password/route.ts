import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateResetCode, generateResetToken } from '@/lib/auth';

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

    return NextResponse.json({
      success: true,
      message: 'Se ha generado la solicitud de restablecimiento de contraseña.',
      email: user.email,
      username: user.username,
      code,
      token,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Error al procesar la recuperación de contraseña.' }, { status: 500 });
  }
}
