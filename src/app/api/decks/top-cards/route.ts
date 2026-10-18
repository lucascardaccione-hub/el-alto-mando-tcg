import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const totalDecksRes = await db.get('SELECT COUNT(*) as total FROM decks WHERE is_public = 1');
    const totalDecks = Number(totalDecksRes?.total) || 0;

    if (totalDecks === 0) {
      return NextResponse.json({
        totalDecks: 0,
        cards: [],
      });
    }

    // Query top 100 most frequent cards across public community decks only
    const rawCards = await db.all(`
      SELECT 
        dc.card_name,
        MAX(dc.image_url) as image_url,
        MAX(dc.category) as category,
        MAX(dc.trainer_type) as trainer_type,
        MAX(dc.expansion) as expansion,
        MAX(dc.number) as number,
        COUNT(DISTINCT dc.deck_id) as deck_appearances,
        SUM(dc.count) as total_copies,
        ROUND(AVG(dc.count), 1) as avg_copies
      FROM deck_cards dc
      JOIN decks d ON dc.deck_id = d.id
      WHERE d.is_public = 1
      GROUP BY dc.card_name
      ORDER BY deck_appearances DESC, total_copies DESC, dc.card_name ASC
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
