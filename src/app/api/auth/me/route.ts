import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessionUser = getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  try {
    const dbUser = await db.get(
      'SELECT id, username, email, role, phone, avatar_url, is_verified, is_active, created_at FROM users WHERE id = ?',
      [sessionUser.id]
    );

    if (!dbUser || dbUser.is_active !== 1) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        phone: dbUser.phone,
        avatar_url: dbUser.avatar_url,
        is_verified: dbUser.is_verified,
        created_at: dbUser.created_at,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: true, user: sessionUser });
  }
}

