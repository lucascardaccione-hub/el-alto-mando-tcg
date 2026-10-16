import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, safeCompareCode } from '@/lib/auth';
import { sendPasswordChangedNotificationEmail } from '@/lib/email';
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
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

    const rateKey = `reset:${cleanEmail || ip}`;
    const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Por seguridad, solicita un nuevo código de recuperación.' },
        { status: 429 }
      );
    }

    let user: any = null;

    if (cleanToken) {
      user = await db.get('SELECT * FROM users WHERE reset_token = ?', [cleanToken]);
    } else if (cleanEmail) {
      user = await db.get(
        'SELECT * FROM users WHERE (email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE)',
        [cleanEmail, cleanEmail]
      );

      if (user && !safeCompareCode(cleanCode, user.reset_code)) {
        const fails = recordFailedAttempt(rateKey);
        if (fails >= 5) {
          await db.run('UPDATE users SET reset_code = NULL, reset_token = NULL WHERE id = ?', [user.id]);
          return NextResponse.json(
            {
              error: 'Código bloqueado tras 5 intentos fallidos. Vuelve al paso anterior para recibir un nuevo código.',
            },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: `Código de recuperación incorrecto. Te quedan ${5 - fails} intentos.` },
          { status: 400 }
        );
      }
    }

    if (!user) {
      recordFailedAttempt(rateKey);
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

    clearFailedAttempts(rateKey);

    const hashed = hashPassword(cleanPassword);

    await db.run(
      `UPDATE users 
       SET password_hash = ?, reset_token = NULL, reset_code = NULL, reset_expires = NULL, is_verified = 1 
       WHERE id = ?`,
      [hashed, user.id]
    );

    // Notify user of password change
    await sendPasswordChangedNotificationEmail({
      to: user.email,
      username: user.username,
    }).catch((e) => console.error('Failed to send password changed email:', e));

    return NextResponse.json({
      success: true,
      message: '¡Tu contraseña ha sido restablecida exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Error al restablecer la contraseña.' }, { status: 500 });
  }
}
