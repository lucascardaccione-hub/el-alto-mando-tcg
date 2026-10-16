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
    if (!deckId) {
      return NextResponse.json({ error: 'ID de mazo inválido' }, { status: 400 });
    }

    const deck = await db.get('SELECT id, user_id, is_public FROM decks WHERE id = ?', [deckId]) as any;
    if (!deck) {
      return NextResponse.json({ error: 'Mazo no encontrado' }, { status: 404 });
    }

    if (deck.is_public === 0) {
      const user = getCurrentUser();
      const isLuca = user && (user.username?.toLowerCase() === 'luca' || user.role === 'admin');
      if (!user || (deck.user_id !== user.id && !isLuca)) {
        return NextResponse.json({ error: 'No autorizado para acceder a este mazo privado' }, { status: 403 });
      }
    }

    const cards = await db.all('SELECT * FROM deck_cards WHERE deck_id = ?', [deckId]) as any[];

    const itemsToAdd: any[] = [];
    let totalEstimated = 0;

    for (const c of cards) {
      const missingCount = Math.max(0, c.count - (c.owned_count || 0));
      if (missingCount <= 0) continue;

      // Find best match in store cards with stock
      const storeCard = await db.get(`
        SELECT * FROM cards
        WHERE name LIKE ? AND stock > 0
        ORDER BY price ASC
        LIMIT 1
      `, [`%${c.card_name}%`]) as any;

      if (storeCard) {
        const qtyToAdd = Math.min(missingCount, storeCard.stock);
        itemsToAdd.push({
          card: storeCard,
          requested_quantity: qtyToAdd,
          missing_in_deck: missingCount,
        });
        totalEstimated += storeCard.price * qtyToAdd;
      }
    }

    return NextResponse.json({
      availableItems: itemsToAdd,
      totalCount: itemsToAdd.length,
      totalEstimated,
    });
  } catch (error: any) {
    console.error('Error getting missing cards to buy:', error);
    return NextResponse.json({ error: 'Error al buscar cartas en tienda' }, { status: 500 });
  }
}
