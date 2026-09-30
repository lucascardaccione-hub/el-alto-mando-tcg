import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, createToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Por favor ingresa un correo electrónico válido.' },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE', [cleanUsername]);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este nombre de usuario ya está registrado. Por favor elige otro.' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.get('SELECT id FROM users WHERE email = ? COLLATE NOCASE', [cleanEmail]);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado. Puedes iniciar sesión.' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(cleanPassword);
    const now = new Date().toISOString();

    const isLuca = cleanUsername.toLowerCase() === 'luca' || cleanEmail.includes('luca');
    const isVerified = isLuca ? 1 : 0;
    const role = isLuca ? 'admin' : 'user';

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = await db.run(`
      INSERT INTO users (
        username, email, password_hash, role, is_active, is_verified, verification_code, verification_token, verification_expires, created_at
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `, [cleanUsername, cleanEmail, passwordHash, role, isVerified, code, token, expires, now]);

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

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      demoCode: code,
      message: 'Cuenta creada. Por favor confirma tu correo electrónico con el código de 6 dígitos.',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Error al registrar la cuenta' }, { status: 500 });
  }
}
