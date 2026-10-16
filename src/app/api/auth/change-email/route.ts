import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateVerificationCode, generateVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { currentEmail, newEmail, username } = await request.json();

    const cleanCurrentEmail = (currentEmail || '').trim().toLowerCase();
    const cleanNewEmail = (newEmail || '').trim().toLowerCase();
    const cleanUsername = (username || '').trim();

    if (!cleanNewEmail) {
      return NextResponse.json({ error: 'Por favor ingresa tu nuevo correo electrónico.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNewEmail)) {
      return NextResponse.json({ error: 'Por favor ingresa un correo electrónico válido.' }, { status: 400 });
    }

    // Locate unverified user by current email or username
    let user: any = null;
    if (cleanCurrentEmail) {
      user = await db.get(
        'SELECT id, username, email, is_verified FROM users WHERE email = ? COLLATE NOCASE',
        [cleanCurrentEmail]
      );
    }
    if (!user && cleanUsername) {
      user = await db.get(
        'SELECT id, username, email, is_verified FROM users WHERE username = ? COLLATE NOCASE',
        [cleanUsername]
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'No se encontró la cuenta asociada.' }, { status: 404 });
    }

    if (user.is_verified === 1) {
      return NextResponse.json(
        { error: 'Esta cuenta ya está verificada y no se puede modificar desde aquí. Inicia sesión para cambiar tus datos.' },
        { status: 403 }
      );
    }

    // Check if new email is already taken by another user
    const emailInUse = await db.get(
      'SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?',
      [cleanNewEmail, user.id]
    );

    if (emailInUse) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está en uso por otra cuenta.' },
        { status: 409 }
      );
    }

    const code = generateVerificationCode();
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.run(
      `UPDATE users 
       SET email = ?, verification_code = ?, verification_token = ?, verification_expires = ? 
       WHERE id = ?`,
      [cleanNewEmail, code, token, expires, user.id]
    );

    // Send verification email to new address
    await sendVerificationEmail({
      to: cleanNewEmail,
      username: user.username,
      code,
      token,
    }).catch((e) => console.error('Failed to send verification email to new address:', e));

    return NextResponse.json({
      success: true,
      message: 'Correo actualizado exitosamente. Hemos enviado un nuevo código de 6 dígitos a tu casilla.',
      newEmail: cleanNewEmail,
    });
  } catch (error: any) {
    console.error('Change email error:', error);
    return NextResponse.json({ error: 'Error al actualizar el correo electrónico.' }, { status: 500 });
  }
}
