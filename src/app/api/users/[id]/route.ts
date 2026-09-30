import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID de usuario inválido.' }, { status: 400 });
    }

    const user = await db.get(
      'SELECT id, username, role, avatar_url, phone, is_verified, created_at FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Fetch public decks by this user
    const decks = await db.all(`
      SELECT d.*,
             (SELECT COUNT(*) FROM deck_cards WHERE deck_id = d.id) as card_types_count,
             (SELECT SUM(count) FROM deck_cards WHERE deck_id = d.id) as total_cards
      FROM decks d
      WHERE d.user_id = ? AND d.is_public = 1
      ORDER BY d.updated_at DESC
    `, [userId]);

    // Only expose phone if user is a seller or admin
    const isSellerOrAdmin = user.role === 'seller' || user.role === 'vendedor' || user.role === 'admin' || user.username?.toLowerCase() === 'luca';

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
        phone: isSellerOrAdmin ? user.phone : null,
        is_verified: user.is_verified,
        created_at: user.created_at,
      },
      decks,
      stats: {
        publicDecksCount: decks.length,
      },
    });
  } catch (error: any) {
    console.error('Fetch user profile error:', error);
    return NextResponse.json({ error: 'Error al obtener el perfil.' }, { status: 500 });
  }
}
