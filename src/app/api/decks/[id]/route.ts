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

    const deck = await db.get(`
      SELECT d.*, u.username as author_name
      FROM decks d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [deckId]) as any;

    if (!deck) {
      return NextResponse.json({ error: 'Mazo no encontrado' }, { status: 404 });
    }

    const cards = await db.all(`
      SELECT * FROM deck_cards WHERE deck_id = ? ORDER BY id ASC
    `, [deckId]) as any[];

    // CROSS-REFERENCE WITH STORE INVENTORY IN REAL TIME:
    // For every card, check if it's available in El Alto Mando store inventory!
    const cardsWithStoreStatus = await Promise.all(cards.map(async (c) => {
      const missingCount = Math.max(0, c.count - (c.owned_count || 0));

      // Query store cards matching by name
      const storeCard = await db.get(`
        SELECT id, name, expansion, number, version, language, price, stock, image_url
        FROM cards
        WHERE name LIKE ? AND stock > 0
        ORDER BY price ASC
        LIMIT 1
      `, [`%${c.card_name}%`]) as any;

      return {
        ...c,
        missing_count: missingCount,
        store_available: Boolean(storeCard && storeCard.stock > 0),
        store_card: storeCard || null,
      };
    }));

    const totalCards = cards.reduce((acc, c) => acc + c.count, 0);
    const ownedCards = cards.reduce((acc, c) => acc + Math.min(c.count, c.owned_count || 0), 0);
    const missingCards = Math.max(0, totalCards - ownedCards);

    return NextResponse.json({
      deck: {
        ...deck,
        total_cards: totalCards,
        owned_cards: ownedCards,
        missing_cards: missingCards,
      },
      cards: cardsWithStoreStatus,
    });
  } catch (error: any) {
    console.error('Error fetching deck detail:', error);
    return NextResponse.json({ error: 'Error al obtener detalles del mazo' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deckId = parseInt(params.id, 10);
    const deck = await db.get('SELECT * FROM decks WHERE id = ?', [deckId]) as any;

    if (!deck) {
      return NextResponse.json({ error: 'Mazo no encontrado' }, { status: 404 });
    }

    if (deck.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permiso para editar este mazo' }, { status: 403 });
    }

    const { name, format, description, is_public, cover_card_image, cards } = await request.json();

    const now = new Date().toISOString();

    await db.run(`
      UPDATE decks
      SET name = COALESCE(?, name),
          format = COALESCE(?, format),
          description = COALESCE(?, description),
          is_public = COALESCE(?, is_public),
          cover_card_image = COALESCE(?, cover_card_image),
          updated_at = ?
      WHERE id = ?
    `, [name, format, description, is_public !== undefined ? (is_public ? 1 : 0) : null, cover_card_image, now, deckId]);

    // If new cards list provided, replace deck cards
    if (Array.isArray(cards)) {
      await db.run('DELETE FROM deck_cards WHERE deck_id = ?', [deckId]);

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

    return NextResponse.json({ success: true, message: 'Mazo actualizado correctamente.' });
  } catch (error: any) {
    console.error('Error updating deck:', error);
    return NextResponse.json({ error: 'Error al actualizar el mazo' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  return PUT(request, context);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deckId = parseInt(params.id, 10);
    const deck = await db.get('SELECT * FROM decks WHERE id = ?', [deckId]) as any;

    if (!deck) {
      return NextResponse.json({ error: 'Mazo no encontrado' }, { status: 404 });
    }

    if (deck.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este mazo' }, { status: 403 });
    }

    await db.run('DELETE FROM deck_cards WHERE deck_id = ?', [deckId]);
    await db.run('DELETE FROM decks WHERE id = ?', [deckId]);

    return NextResponse.json({ success: true, message: 'Mazo eliminado.' });
  } catch (error: any) {
    console.error('Error deleting deck:', error);
    return NextResponse.json({ error: 'Error al eliminar el mazo' }, { status: 500 });
  }
}
