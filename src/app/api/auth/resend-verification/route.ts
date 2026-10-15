import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateVerificationCode, generateVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email requerido.' }, { status: 400 });
    }

    const user = await db.get('SELECT id, username, email, is_verified FROM users WHERE email = ? COLLATE NOCASE', [cleanEmail]);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    if (user.is_verified === 1) {
      return NextResponse.json({ message: 'Esta cuenta ya está verificada. Puedes iniciar sesión.' });
    }

    const code = generateVerificationCode();
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await db.run(
      'UPDATE users SET verification_code = ?, verification_token = ?, verification_expires = ? WHERE id = ?',
      [code, token, expires, user.id]
    );

    // Send email with new verification code
    await sendVerificationEmail({
      to: user.email,
      username: user.username,
      code,
      token,
    }).catch((e) => console.error('Failed to send verification email:', e));

    return NextResponse.json({
      success: true,
      message: 'Hemos enviado un nuevo código de verificación a tu correo.',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Error al reenviar código.' }, { status: 500 });
  }
}
