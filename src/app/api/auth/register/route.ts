import { NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  hashPassword,
  comparePassword,
  createToken,
  COOKIE_NAME,
  generateVerificationCode,
  generateVerificationToken,
  createPendingVerifyToken,
  getPendingVerifySession,
  PENDING_VERIFY_COOKIE,
} from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { validateAndSuggestEmail, checkRateLimit, recordFailedAttempt, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`register:${ip}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos de registro. Intenta nuevamente en ${Math.ceil(rate.retryAfterSeconds / 60)} minutos.` },
        { status: 429 }
      );
    }

    const { username, email, password } = await request.json();

    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios: Nombre de usuario, email y contraseña.' },
        { status: 400 }
      );
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      return NextResponse.json(
        { error: 'El nombre de usuario debe tener entre 3 y 24 caracteres.' },
        { status: 400 }
      );
    }

    // Smart email validation & typo detection (.dom, gmial.com, etc.)
    const emailValidation = validateAndSuggestEmail(cleanEmail);
    if (!emailValidation.valid) {
      return NextResponse.json(
        {
          error: emailValidation.reason || 'Por favor ingresa un correo electrónico válido.',
          suggestion: emailValidation.suggestion,
        },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const pendingSession = getPendingVerifySession();

    // Check if username already exists
    const existingUser = await db.get(
      'SELECT id, username, email, password_hash, is_verified, verification_expires FROM users WHERE username = ? COLLATE NOCASE',
      [cleanUsername]
    );

    if (existingUser) {
      if (existingUser.is_verified === 1) {
        return NextResponse.json(
          { error: 'Este nombre de usuario ya está registrado. Por favor elige otro.' },
          { status: 409 }
        );
      }

      // Account is unverified: verify ownership via pending session cookie, matching password, or expired verification
      const isSameSession = pendingSession && pendingSession.userId === existingUser.id;
      const isPasswordMatch = comparePassword(cleanPassword, existingUser.password_hash);
      const isExpired = existingUser.verification_expires
        ? Date.now() > new Date(existingUser.verification_expires).getTime()
        : false;

      if (!isSameSession && !isPasswordMatch && !isExpired) {
        recordFailedAttempt(`register:${ip}`);
        return NextResponse.json(
          {
            error:
              'Este nombre de usuario está pendiente de activación. Si es tu cuenta y deseas corregir el correo, ingresa la misma contraseña que usaste al registrarte.',
          },
          { status: 409 }
        );
      }

      const emailTaken = await db.get(
        'SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?',
        [cleanEmail, existingUser.id]
      );
      if (emailTaken) {
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado con otra cuenta. Puedes iniciar sesión.' },
          { status: 409 }
        );
      }

      const passwordHash = hashPassword(cleanPassword);
      const code = generateVerificationCode();
      const token = generateVerificationToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await db.run(
        `UPDATE users 
         SET email = ?, password_hash = ?, verification_code = ?, verification_token = ?, verification_expires = ? 
         WHERE id = ?`,
        [cleanEmail, passwordHash, code, token, expires, existingUser.id]
      );

      await sendVerificationEmail({
        to: cleanEmail,
        username: cleanUsername,
        code,
        token,
      }).catch((e) => console.error('Failed to send verification email:', e));

      const pendingToken = createPendingVerifyToken({
        userId: existingUser.id,
        username: cleanUsername,
        email: cleanEmail,
      });

      const response = NextResponse.json({
        success: true,
        requiresVerification: true,
        email: cleanEmail,
        message: 'Hemos actualizado tu registro y enviado un nuevo código de 6 dígitos a tu correo.',
      });

      response.cookies.set({
        name: PENDING_VERIFY_COOKIE,
        value: pendingToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2,
        path: '/',
      });

      return response;
    }

    // Check if email already exists
    const existingEmail = await db.get(
      'SELECT id, username, password_hash, is_verified, verification_expires FROM users WHERE email = ? COLLATE NOCASE',
      [cleanEmail]
    );
    if (existingEmail) {
      if (existingEmail.is_verified === 1) {
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado. Puedes iniciar sesión.' },
          { status: 409 }
        );
      }

      const isSameSession = pendingSession && pendingSession.userId === existingEmail.id;
      const isPasswordMatch = comparePassword(cleanPassword, existingEmail.password_hash);
      const isExpired = existingEmail.verification_expires
        ? Date.now() > new Date(existingEmail.verification_expires).getTime()
        : false;

      if (!isSameSession && !isPasswordMatch && !isExpired) {
        return NextResponse.json(
          { error: 'Este correo electrónico ya tiene una cuenta pendiente de activación.' },
          { status: 409 }
        );
      }

      const passwordHash = hashPassword(cleanPassword);
      const code = generateVerificationCode();
      const token = generateVerificationToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await db.run(
        `UPDATE users 
         SET username = ?, password_hash = ?, verification_code = ?, verification_token = ?, verification_expires = ? 
         WHERE id = ?`,
        [cleanUsername, passwordHash, code, token, expires, existingEmail.id]
      );

      await sendVerificationEmail({
        to: cleanEmail,
        username: cleanUsername,
        code,
        token,
      }).catch((e) => console.error('Failed to send verification email:', e));

      const pendingToken = createPendingVerifyToken({
        userId: existingEmail.id,
        username: cleanUsername,
        email: cleanEmail,
      });

      const response = NextResponse.json({
        success: true,
        requiresVerification: true,
        email: cleanEmail,
        message: 'Hemos actualizado tu registro y enviado un código de 6 dígitos a tu correo.',
      });

      response.cookies.set({
        name: PENDING_VERIFY_COOKIE,
        value: pendingToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2,
        path: '/',
      });

      return response;
    }

    const passwordHash = hashPassword(cleanPassword);
    const now = new Date().toISOString();

    const isLuca = cleanUsername.toLowerCase() === 'luca';
    const isVerified = isLuca ? 1 : 0;
    const role = isLuca ? 'admin' : 'user';

    const code = generateVerificationCode();
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = await db.run(
      `
      INSERT INTO users (
        username, email, password_hash, role, is_active, is_verified, verification_code, verification_token, verification_expires, created_at
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `,
      [cleanUsername, cleanEmail, passwordHash, role, isVerified, code, token, expires, now]
    );

    const userId = Number(result.lastInsertRowid);

    if (isVerified === 1) {
      const sessionToken = createToken({
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        role,
        is_verified: 1,
      });

      const response = NextResponse.json({
        success: true,
        message: '¡Cuenta creada con éxito! Bienvenido a El Alto Mando TCG.',
        user: { id: userId, username: cleanUsername, email: cleanEmail, role },
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
    }

    // Send verification email to user
    await sendVerificationEmail({
      to: cleanEmail,
      username: cleanUsername,
      code,
      token,
    }).catch((e) => console.error('Failed to send verification email:', e));

    const pendingToken = createPendingVerifyToken({
      userId,
      username: cleanUsername,
      email: cleanEmail,
    });

    const response = NextResponse.json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      message: 'Cuenta creada. Hemos enviado un código de 6 dígitos a tu correo electrónico para verificar tu cuenta.',
    });

    response.cookies.set({
      name: PENDING_VERIFY_COOKIE,
      value: pendingToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Error al registrar la cuenta' }, { status: 500 });
  }
}
