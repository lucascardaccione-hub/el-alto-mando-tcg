import { NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  comparePassword,
  generateVerificationCode,
  generateVerificationToken,
  getPendingVerifySession,
  createPendingVerifyToken,
  PENDING_VERIFY_COOKIE,
} from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { validateAndSuggestEmail, checkActionCooldown, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { currentEmail, newEmail, username, password } = await request.json();

    const cleanCurrentEmail = (currentEmail || '').trim().toLowerCase();
    const cleanNewEmail = (newEmail || '').trim().toLowerCase();
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanNewEmail) {
      return NextResponse.json({ error: 'Por favor ingresa tu nuevo correo electrónico.' }, { status: 400 });
    }

    const emailValidation = validateAndSuggestEmail(cleanNewEmail);
    if (!emailValidation.valid) {
      return NextResponse.json(
        {
          error: emailValidation.reason || 'Por favor ingresa un correo electrónico válido.',
          suggestion: emailValidation.suggestion,
        },
        { status: 400 }
      );
    }

    const pendingSession = getPendingVerifySession();

    // Locate unverified user by pending session, current email, or username
    let user: any = null;
    if (pendingSession?.userId) {
      user = await db.get(
        'SELECT id, username, email, password_hash, is_verified FROM users WHERE id = ?',
        [pendingSession.userId]
      );
    }
    if (!user && cleanCurrentEmail) {
      user = await db.get(
        'SELECT id, username, email, password_hash, is_verified FROM users WHERE email = ? COLLATE NOCASE',
        [cleanCurrentEmail]
      );
    }
    if (!user && cleanUsername) {
      user = await db.get(
        'SELECT id, username, email, password_hash, is_verified FROM users WHERE username = ? COLLATE NOCASE',
        [cleanUsername]
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'No se encontró la cuenta asociada.' }, { status: 404 });
    }

    if (user.is_verified === 1) {
      return NextResponse.json(
        { error: 'Esta cuenta ya está verificada. Inicia sesión para gestionar tus datos.' },
        { status: 403 }
      );
    }

    // Ownership authorization: either active pending session cookie for this userId OR valid password
    const authorizedByCookie = pendingSession && pendingSession.userId === user.id;
    const authorizedByPassword = cleanPassword ? comparePassword(cleanPassword, user.password_hash) : false;

    if (!authorizedByCookie && !authorizedByPassword) {
      return NextResponse.json(
        {
          error: cleanPassword
            ? 'La contraseña ingresada es incorrecta.'
            : 'Por seguridad, ingresa la contraseña de tu cuenta para confirmar el cambio de correo.',
          requiresPassword: true,
        },
        { status: 401 }
      );
    }

    // Cooldown check
    const cooldown = checkActionCooldown(`change-email:${user.id}:${ip}`, 30);
    if (!cooldown.allowed) {
      return NextResponse.json(
        { error: `Por favor espera ${cooldown.waitSeconds} segundos antes de solicitar otro cambio.` },
        { status: 429 }
      );
    }

    // Check if new email is already taken by another user
    const emailInUse = await db.get(
      'SELECT id, is_verified FROM users WHERE email = ? COLLATE NOCASE AND id != ?',
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

    const newPendingToken = createPendingVerifyToken({
      userId: user.id,
      username: user.username,
      email: cleanNewEmail,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Correo actualizado exitosamente. Hemos enviado un nuevo código de 6 dígitos a tu casilla.',
      newEmail: cleanNewEmail,
    });

    response.cookies.set({
      name: PENDING_VERIFY_COOKIE,
      value: newPendingToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Change email error:', error);
    return NextResponse.json({ error: 'Error al actualizar el correo electrónico.' }, { status: 500 });
  }
}
