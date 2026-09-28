import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deckId = parseInt(params.id, 10);
    const cards = db.prepare('SELECT * FROM deck_cards WHERE deck_id = ?').all(deckId) as any[];

    const itemsToAdd: any[] = [];
    let totalEstimated = 0;

    for (const c of cards) {
      const missingCount = Math.max(0, c.count - (c.owned_count || 0));
      if (missingCount <= 0) continue;

      // Find best match in store cards with stock
      const storeCard = db.prepare(`
        SELECT * FROM cards
        WHERE name LIKE ? AND stock > 0
        ORDER BY price ASC
        LIMIT 1
      `).get(`%${c.card_name}%`) as any;

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
