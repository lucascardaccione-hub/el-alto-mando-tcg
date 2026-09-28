import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function GET() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const users = db.prepare('SELECT id, username, role, is_active, created_at FROM users ORDER BY id ASC').all();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { username, password, role = 'admin' } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Nombre de usuario y contraseña son requeridos' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(cleanUsername);
    if (existing) {
      return NextResponse.json({ error: 'El nombre de usuario ya está registrado' }, { status: 400 });
    }

    const hashed = hashPassword(password);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, role, is_active, created_at)
      VALUES (?, ?, ?, 1, ?)
    `);

    const result = stmt.run(cleanUsername, hashed, role, now);

    return NextResponse.json({
      success: true,
      user: {
        id: result.lastInsertRowid,
        username: cleanUsername,
        role,
        is_active: 1,
        created_at: now,
      },
    });
  } catch (error: any) {
    console.error('User creation error:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, is_active, password } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Prevent deactivating own account
    if (currentUser.id === id && is_active === 0) {
      return NextResponse.json({ error: 'No puedes deshabilitar tu propia cuenta' }, { status: 400 });
    }

    if (password) {
      const hashed = hashPassword(password);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashed, id);
    }

    if (is_active !== undefined) {
      db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '', 10);

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    if (currentUser.id === id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return NextResponse.json({ success: true, message: 'Usuario eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
