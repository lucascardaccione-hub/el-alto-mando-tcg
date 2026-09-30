import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, comparePassword, hashPassword, createToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const session = getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Debes iniciar sesión para editar tu perfil.' }, { status: 401 });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [session.id]);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    const { avatar_url, phone, currentPassword, newPassword } = await request.json();

    // 1. Password change requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Debes ingresar tu contraseña actual para cambiarla.' }, { status: 400 });
      }

      const isCurrentValid = comparePassword(currentPassword, user.password_hash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'La contraseña actual ingresada es incorrecta.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
      }

      const newHash = hashPassword(newPassword);
      await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
    }

    // 2. Avatar update
    if (avatar_url !== undefined) {
      const cleanAvatar = (avatar_url || '').trim();
      await db.run('UPDATE users SET avatar_url = ? WHERE id = ?', [cleanAvatar || null, user.id]);
    }

    // 3. Phone / WhatsApp update
    if (phone !== undefined) {
      const cleanPhone = (phone || '').replace(/[^\d+]/g, '').trim();
      await db.run('UPDATE users SET phone = ? WHERE id = ?', [cleanPhone, user.id]);
    }

    // Fetch fresh user
    const updated = await db.get(
      'SELECT id, username, email, role, phone, avatar_url, is_verified, created_at FROM users WHERE id = ?',
      [user.id]
    );

    // Refresh cookie token with updated data
    const newToken = createToken({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      is_verified: updated.is_verified,
      avatar_url: updated.avatar_url,
      phone: updated.phone,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Perfil actualizado correctamente.',
      user: updated,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Error al actualizar el perfil.' }, { status: 500 });
  }
}
