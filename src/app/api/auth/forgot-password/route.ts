import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateResetCode, generateResetToken } from '@/lib/auth';
import { sendPasswordResetEmail, maskEmail } from '@/lib/email';
import { checkActionCooldown, checkRateLimit, clearFailedAttempts, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { identifier } = await request.json();
    const cleanId = (identifier || '').trim();

    if (!cleanId) {
      return NextResponse.json({ error: 'Por favor ingresa tu usuario o correo electrónico.' }, { status: 400 });
    }

    const rate = checkRateLimit(`forgot-ip:${ip}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes. Por favor espera ${Math.ceil(rate.retryAfterSeconds / 60)} minutos.` },
        { status: 429 }
      );
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

    const cooldown = checkActionCooldown(`forgot:${user.id}`, 45);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          error: `Ya enviamos un código recientemente. Espera ${cooldown.waitSeconds} segundos para solicitar otro.`,
          waitSeconds: cooldown.waitSeconds,
        },
        { status: 429 }
      );
    }

    const code = generateResetCode();
    const token = generateResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await db.run(
      'UPDATE users SET reset_code = ?, reset_token = ?, reset_expires = ? WHERE id = ?',
      [code, token, expires, user.id]
    );

    clearFailedAttempts(`reset:${user.email.toLowerCase()}`);

    // Send email with recovery code
    await sendPasswordResetEmail({
      to: user.email,
      username: user.username,
      code,
      token,
    }).catch((e) => console.error('Failed to send password reset email:', e));

    return NextResponse.json({
      success: true,
      message: 'Hemos enviado un código de 6 dígitos a tu correo electrónico para restablecer tu contraseña.',
      email: user.email,
      maskedEmail: maskEmail(user.email),
      cooldownSeconds: 45,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Error al procesar la recuperación de contraseña.' }, { status: 500 });
  }
}
