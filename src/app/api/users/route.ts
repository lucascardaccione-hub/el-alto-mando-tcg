import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const isLuca = currentUser.username.toLowerCase() === 'luca';

  const users = await db.all('SELECT id, username, email, role, is_active, created_at FROM users ORDER BY id ASC');
  return NextResponse.json({
    users,
    canManageUsers: isLuca,
  });
}

export async function POST(request: Request) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.username.toLowerCase() !== 'luca') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solamente el usuario Luca puede habilitar usuarios para el panel de administración.' },
        { status: 403 }
      );
    }

    const { username, password, email, role = 'admin' } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Nombre de usuario y contraseña son requeridos' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    const existing = await db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE', [cleanUsername]);
    if (existing) {
      return NextResponse.json({ error: 'El nombre de usuario ya está registrado' }, { status: 400 });
    }

    const hashed = hashPassword(password);
    const now = new Date().toISOString();

    const result = await db.run(`
      INSERT INTO users (username, email, password_hash, role, is_active, is_verified, created_at)
      VALUES (?, ?, ?, ?, 1, 1, ?)
    `, [cleanUsername, cleanEmail, role, hashed, now]);

    return NextResponse.json({
      success: true,
      user: {
        id: result.lastInsertRowid,
        username: cleanUsername,
        email: cleanEmail,
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
    if (!currentUser || currentUser.username.toLowerCase() !== 'luca') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solamente el usuario Luca puede habilitar o deshabilitar usuarios en el panel.' },
        { status: 403 }
      );
    }

    const { id, is_active, password, role } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Prevent deactivating own account
    if (currentUser.id === id && is_active === 0) {
      return NextResponse.json({ error: 'No puedes deshabilitar tu propia cuenta' }, { status: 400 });
    }

    if (password) {
      const hashed = hashPassword(password);
      await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, id]);
    }

    if (role !== undefined) {
      await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    }

    if (is_active !== undefined) {
      await db.run('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.username.toLowerCase() !== 'luca') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solamente el usuario Luca puede revocar o eliminar accesos de administración.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '', 10);

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    if (currentUser.id === id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Usuario eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}

