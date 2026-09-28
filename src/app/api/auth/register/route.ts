import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, createToken, COOKIE_NAME } from '@/lib/auth';

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
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(cleanUsername);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este nombre de usuario ya está registrado. Por favor elige otro.' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(cleanEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado. Puedes iniciar sesión.' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(cleanPassword);
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO users (
        username, email, password_hash, role, is_active, is_verified, created_at
      ) VALUES (?, ?, ?, 'user', 1, 1, ?)
    `);

    const result = insertStmt.run(
      cleanUsername,
      cleanEmail,
      passwordHash,
      now
    );

    const userId = Number(result.lastInsertRowid);

    const token = createToken({
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      role: 'user',
      is_verified: 1,
    });

    const response = NextResponse.json({
      success: true,
      message: '¡Cuenta creada con éxito! Bienvenido a El Alto Mando TCG.',
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        role: 'user',
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Error al registrar la cuenta' }, { status: 500 });
  }
}
