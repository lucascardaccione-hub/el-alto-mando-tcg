import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateExp, getUserLevelInfo, POKEMON_REGIONS } from '@/lib/rewards';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    let targetUserId: number | null = null;
    if (requestedUserId) {
      targetUserId = parseInt(requestedUserId, 10);
    } else {
      const session = getCurrentUser();
      if (session) {
        targetUserId = session.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'No autorizado o usuario no especificado.' }, { status: 401 });
    }

    // 1. Decks count created by this user
    const decksResult = await db.get(
      'SELECT COUNT(*) as count FROM decks WHERE user_id = ?',
      [targetUserId]
    );
    const decksCount = Number(decksResult?.count || 0);

    // 2. Comments count left by this user
    let commentsCount = 0;
    try {
      const commentsResult = await db.get(
        'SELECT COUNT(*) as count FROM deck_comments WHERE user_id = ?',
        [targetUserId]
      );
      commentsCount = Number(commentsResult?.count || 0);
    } catch {
      commentsCount = 0;
    }

    // 3. Likes given by this user
    let likesCount = 0;
    try {
      const likesResult = await db.get(
        'SELECT COUNT(*) as count FROM deck_likes WHERE user_id = ?',
        [targetUserId]
      );
      likesCount = Number(likesResult?.count || 0);
    } catch {
      likesCount = 0;
    }

    // 4. Completed orders and total spent in store
    let ordersCount = 0;
    let totalSpent = 0;
    try {
      const ordersResult = await db.get(
        'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM orders WHERE user_id = ?',
        [targetUserId]
      );
      ordersCount = Number(ordersResult?.count || 0);
      totalSpent = Number(ordersResult?.total || 0);
    } catch {
      ordersCount = 0;
      totalSpent = 0;
    }

    const exp = calculateExp({
      decksCount,
      commentsCount,
      likesCount,
      ordersCount,
      totalSpent,
    });

    const levelInfo = getUserLevelInfo(exp);

    return NextResponse.json({
      userId: targetUserId,
      stats: {
        decksCount,
        commentsCount,
        likesCount,
        ordersCount,
        totalSpent,
      },
      levelInfo,
      regions: POKEMON_REGIONS,
    });
  } catch (error: any) {
    console.error('Rewards API error:', error);
    return NextResponse.json({ error: 'Error al calcular recompensas.' }, { status: 500 });
  }
}
