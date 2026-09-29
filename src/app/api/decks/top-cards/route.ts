import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const totalDecksRes = await db.get('SELECT COUNT(*) as total FROM decks');
    const totalDecks = Number(totalDecksRes?.total) || 0;

    if (totalDecks === 0) {
      return NextResponse.json({
        totalDecks: 0,
        cards: [],
      });
    }

    // Query top 100 most frequent cards across all decks
    const rawCards = await db.all(`
      SELECT 
        card_name,
        MAX(image_url) as image_url,
        MAX(category) as category,
        MAX(trainer_type) as trainer_type,
        MAX(expansion) as expansion,
        MAX(number) as number,
        COUNT(DISTINCT deck_id) as deck_appearances,
        SUM(count) as total_copies,
        ROUND(AVG(count), 1) as avg_copies
      FROM deck_cards
      GROUP BY card_name
      ORDER BY deck_appearances DESC, total_copies DESC, card_name ASC
      LIMIT 100
    `);

    // Match with store availability
    const storeCards = await db.all('SELECT name, price, stock FROM cards WHERE stock > 0');
    const storeMap = new Map<string, { minPrice: number; stock: number }>();
    storeCards.forEach((sc: any) => {
      const key = (sc.name || '').toLowerCase().trim();
      if (!storeMap.has(key)) {
        storeMap.set(key, { minPrice: sc.price, stock: sc.stock });
      } else {
        const cur = storeMap.get(key)!;
        cur.minPrice = Math.min(cur.minPrice, sc.price);
        cur.stock += sc.stock;
      }
    });

    const cards = rawCards.map((c: any, index: number) => {
      const appearances = Number(c.deck_appearances) || 0;
      const usagePercentage = totalDecks > 0
        ? Math.round((appearances / totalDecks) * 1000) / 10
        : 0;

      const storeMatch = storeMap.get((c.card_name || '').toLowerCase().trim());

      return {
        rank: index + 1,
        card_name: c.card_name,
        image_url: c.image_url,
        category: (c.category || 'pokemon').toLowerCase(),
        trainer_type: c.trainer_type || '',
        expansion: c.expansion || '',
        number: c.number || '',
        deck_appearances: appearances,
        total_copies: Number(c.total_copies) || 0,
        avg_copies: Number(c.avg_copies) || 1,
        usage_percentage: usagePercentage,
        in_store: !!storeMatch,
        store_price: storeMatch ? storeMatch.minPrice : null,
      };
    });

    return NextResponse.json({
      totalDecks,
      cards,
    });
  } catch (error: any) {
    console.error('Error in top-cards route:', error);
    return NextResponse.json({ error: 'Error al obtener cartas frecuentes' }, { status: 500 });
  }
}
