import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = getCurrentUser();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'my'; // 'my' | 'public'

    let decks: any[] = [];

    if (filter === 'public') {
      decks = await db.all(`
        SELECT d.*, u.username as author_name,
               (SELECT COUNT(*) FROM deck_cards WHERE deck_id = d.id) as card_types_count,
               (SELECT SUM(count) FROM deck_cards WHERE deck_id = d.id) as total_cards
        FROM decks d
        JOIN users u ON d.user_id = u.id
        WHERE d.is_public = 1
        ORDER BY d.updated_at DESC
        LIMIT 50
      `);
    } else {
      if (!user) {
        return NextResponse.json({ decks: [] });
      }
      decks = await db.all(`
        SELECT d.*, u.username as author_name,
               (SELECT COUNT(*) FROM deck_cards WHERE deck_id = d.id) as card_types_count,
               (SELECT SUM(count) FROM deck_cards WHERE deck_id = d.id) as total_cards
        FROM decks d
        JOIN users u ON d.user_id = u.id
        WHERE d.user_id = ?
        ORDER BY d.updated_at DESC
      `, [user.id]);
    }

    return NextResponse.json({ decks });
  } catch (error: any) {
    console.error('Error fetching decks:', error);
    return NextResponse.json({ error: 'Error al obtener los mazos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para crear y guardar mazos.' }, { status: 401 });
    }

    const { name, format, description, is_public, cover_card_image, cards } = await request.json();

    const cleanName = (name || '').trim();
    if (!cleanName) {
      return NextResponse.json({ error: 'El nombre del mazo es obligatorio.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const deckResult = await db.run(`
      INSERT INTO decks (user_id, name, format, description, is_public, cover_card_image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id,
      cleanName,
      format || 'Standard',
      description || '',
      is_public !== undefined ? (is_public ? 1 : 0) : 1,
      cover_card_image || '',
      now,
      now
    ]);

    const deckId = deckResult.lastInsertRowid;

    if (Array.isArray(cards) && cards.length > 0) {
      const cardBatch = cards.map((c: any) => ({
        sql: `INSERT INTO deck_cards (deck_id, card_name, expansion, number, category, trainer_type, count, owned_count, image_url, tcg_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          deckId,
          c.card_name || c.name,
          c.expansion || c.set || 'PROMO',
          c.number || '1',
          c.category || 'pokemon',
          c.trainer_type || '',
          Math.max(1, parseInt(c.count, 10) || 1),
          Math.max(0, parseInt(c.owned_count, 10) || 0),
          c.image_url || c.image || '/placeholder-card.svg',
          c.tcg_id || ''
        ],
      }));

      await db.batch(cardBatch);
    }

    return NextResponse.json({
      success: true,
      message: 'Mazo creado exitosamente.',
      deckId,
    });
  } catch (error: any) {
    console.error('Error creating deck:', error);
    return NextResponse.json({ error: 'Error al guardar el mazo' }, { status: 500 });
  }
}
