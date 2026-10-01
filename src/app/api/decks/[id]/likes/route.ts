import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deckId = parseInt(params.id, 10);
    if (!deckId) return NextResponse.json({ error: 'ID de mazo inválido' }, { status: 400 });

    const likesCountResult = await db.get(`
      SELECT COUNT(*) as likes_count
      FROM deck_likes
      WHERE deck_id = ?
    `, [deckId]) as any;

    let userLiked = false;
    const user = getCurrentUser();
    if (user) {
      const userLikeResult = await db.get(`
        SELECT id FROM deck_likes WHERE deck_id = ? AND user_id = ?
      `, [deckId, user.id]) as any;
      if (userLikeResult) {
        userLiked = true;
      }
    }

    return NextResponse.json({
      likes_count: likesCountResult?.likes_count || 0,
      user_liked: userLiked,
    });
  } catch (error: any) {
    console.error('Error fetching likes:', error);
    return NextResponse.json({ error: 'Error al obtener me gustas' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deckId = parseInt(params.id, 10);
    if (!deckId) return NextResponse.json({ error: 'ID de mazo inválido' }, { status: 400 });

    const existingLike = await db.get(`
      SELECT id FROM deck_likes WHERE deck_id = ? AND user_id = ?
    `, [deckId, user.id]) as any;

    if (existingLike) {
      // Unlike
      await db.run(`DELETE FROM deck_likes WHERE id = ?`, [existingLike.id]);
    } else {
      // Like
      const now = new Date().toISOString();
      await db.run(`
        INSERT INTO deck_likes (deck_id, user_id, created_at)
        VALUES (?, ?, ?)
      `, [deckId, user.id, now]);
    }

    const newLikesCountResult = await db.get(`
      SELECT COUNT(*) as likes_count
      FROM deck_likes
      WHERE deck_id = ?
    `, [deckId]) as any;

    return NextResponse.json({
      liked: !existingLike,
      likes_count: newLikesCountResult?.likes_count || 0,
    });
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Error al procesar el me gusta' }, { status: 500 });
  }
}
