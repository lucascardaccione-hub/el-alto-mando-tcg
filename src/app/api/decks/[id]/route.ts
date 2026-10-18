import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { validateDeckLegality } from '@/lib/deckParser';

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

    const user = getCurrentUser();
    const isOwner = user ? deck.user_id === user.id : false;
    const isLuca = user
      ? user.username?.toLowerCase() === 'luca' || user.role === 'admin'
      : false;
    const canEdit = isOwner || isLuca;

    // Private deck protection: only owner or admin can view private draft decks
    if (deck.is_public === 0 && !canEdit) {
      return NextResponse.json(
        { error: 'Este mazo es un borrador privado y solo puede ser visto por su creador.' },
        { status: 403 }
      );
    }

    const cards = await db.all(`
      SELECT * FROM deck_cards WHERE deck_id = ? ORDER BY id ASC
    `, [deckId]) as any[];

    // CROSS-REFERENCE WITH STORE INVENTORY IN A SINGLE QUERY (eliminates N+1 queries):
    const allInStockCards = cards.length > 0
      ? (await db.all(`
          SELECT id, name, expansion, number, version, language, price, stock, image_url
          FROM cards
          WHERE stock > 0
          ORDER BY price ASC
        `) as any[])
      : [];

    const cardsWithStoreStatus = cards.map((c) => {
      const missingCount = Math.max(0, c.count - (c.owned_count || 0));
      const targetName = (c.card_name || '').trim().toLowerCase();

      const storeCard = targetName
        ? allInStockCards.find((sc) => {
            const scName = (sc.name || '').trim().toLowerCase();
            return scName === targetName || scName.includes(targetName) || targetName.includes(scName);
          })
        : null;

      return {
        ...c,
        missing_count: missingCount,
        store_available: Boolean(storeCard && storeCard.stock > 0),
        store_card: storeCard || null,
      };
    });

    const totalCards = cards.reduce((acc, c) => acc + c.count, 0);
    const ownedCards = cards.reduce((acc, c) => acc + Math.min(c.count, c.owned_count || 0), 0);
    const missingCards = Math.max(0, totalCards - ownedCards);

    // Social metrics
    const likesCountResult = await db.get(`SELECT COUNT(*) as count FROM deck_likes WHERE deck_id = ?`, [deckId]) as any;
    const commentsStatsResult = await db.get(`
      SELECT 
        COUNT(*) as comments_count, 
        AVG(rating) as average_rating 
      FROM deck_comments 
      WHERE deck_id = ?
    `, [deckId]) as any;
    
    let userLiked = false;
    if (user) {
      const userLikeResult = await db.get(`SELECT id FROM deck_likes WHERE deck_id = ? AND user_id = ?`, [deckId, user.id]);
      if (userLikeResult) userLiked = true;
    }

    return NextResponse.json({
      deck: {
        ...deck,
        can_edit: canEdit,
        is_owner: isOwner,
        total_cards: totalCards,
        owned_cards: ownedCards,
        missing_cards: missingCards,
        likes_count: likesCountResult?.count || 0,
        user_liked: userLiked,
        comments_count: commentsStatsResult?.comments_count || 0,
        average_rating: commentsStatsResult?.average_rating || null,
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
    if (isNaN(deckId) || deckId <= 0) {
      return NextResponse.json({ error: 'ID de mazo inválido' }, { status: 400 });
    }

    const deck = await db.get('SELECT * FROM decks WHERE id = ?', [deckId]) as any;

    if (!deck) {
      return NextResponse.json({ error: 'Mazo no encontrado' }, { status: 404 });
    }

    const isOwner = deck.user_id === user.id;
    const isLuca =
      user.username?.toLowerCase() === 'luca' ||
      user.role === 'admin';

    if (!isOwner && !isLuca) {
      return NextResponse.json(
        {
          error:
            'No tienes permiso para modificar este mazo. Solo el creador original o un administrador pueden editarlo. Puedes crear una copia en tus mazos.',
        },
        { status: 403 }
      );
    }

    const { name, format, description, is_public, cover_card_image, cards } = await request.json();

    let totalCards = 0;
    if (Array.isArray(cards)) {
      const legality = validateDeckLegality(cards);
      totalCards = legality.totalCards;
      if (legality.errors.length > 0) {
        return NextResponse.json({
          error: legality.errors[0],
          errors: legality.errors,
        }, { status: 400 });
      }
    } else {
      const row = await db.get(`SELECT SUM(count) as total FROM deck_cards WHERE deck_id = ?`, [deckId]) as any;
      totalCards = Number(row?.total || 0);
    }

    let finalIsPublic: number | null = null;
    if (is_public !== undefined) {
      const requestedPublic = is_public ? 1 : 0;
      if (requestedPublic === 1 && totalCards !== 60) {
        return NextResponse.json({
          error: `No se puede publicar un mazo con ${totalCards}/60 cartas reglamentarias en la comunidad (debe tener exactamente 60 cartas). Debe guardarse como borrador privado hasta completarlo.`,
        }, { status: 400 });
      }
      finalIsPublic = totalCards === 60 ? requestedPublic : 0;
    } else {
      // If cards are not 60 and deck was public, auto-demote to private draft
      if (totalCards !== 60 && deck.is_public === 1) {
        finalIsPublic = 0;
      }
    }

    const now = new Date().toISOString();
    const cleanName = typeof name === 'string' ? name.trim() : null;

    await db.run(`
      UPDATE decks
      SET name = COALESCE(?, name),
          format = COALESCE(?, format),
          description = COALESCE(?, description),
          is_public = COALESCE(?, is_public),
          cover_card_image = COALESCE(?, cover_card_image),
          updated_at = ?
      WHERE id = ?
    `, [cleanName || null, format ?? null, description ?? null, finalIsPublic, cover_card_image ?? null, now, deckId]);

    // If new cards list provided, replace deck cards
    if (Array.isArray(cards)) {
      await db.run('DELETE FROM deck_cards WHERE deck_id = ?', [deckId]);

      if (cards.length > 0) {
        const cardBatch = cards.map((c: any) => ({
          sql: `INSERT INTO deck_cards (deck_id, card_name, expansion, number, category, trainer_type, count, owned_count, image_url, tcg_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            deckId,
            String(c.card_name || c.name || 'Carta').trim(),
            String(c.expansion || c.set || 'PROMO').trim(),
            String(c.number || '1').trim(),
            String(c.category || 'pokemon').trim(),
            String(c.trainer_type || '').trim(),
            Math.max(1, parseInt(c.count, 10) || 1),
            Math.max(0, parseInt(c.owned_count, 10) || 0),
            String(c.image_url || c.image || '/placeholder-card.svg').trim(),
            String(c.tcg_id || '').trim()
          ],
        }));

        await db.batch(cardBatch);
      }
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
    if (isNaN(deckId) || deckId <= 0) {
      return NextResponse.json({ error: 'ID de mazo inválido' }, { status: 400 });
    }

    const deck = await db.get('SELECT * FROM decks WHERE id = ?', [deckId]) as any;

    if (!deck) {
      return NextResponse.json({ error: 'Mazo no encontrado' }, { status: 404 });
    }

    const isOwner = deck.user_id === user.id;
    const isLuca =
      user.username?.toLowerCase() === 'luca' ||
      user.role === 'admin';

    if (!isOwner && !isLuca) {
      return NextResponse.json(
        {
          error:
            'No tienes permiso para eliminar este mazo. Solo el creador original o un administrador pueden eliminarlo.',
        },
        { status: 403 }
      );
    }

    await db.run('DELETE FROM deck_cards WHERE deck_id = ?', [deckId]);
    await db.run('DELETE FROM deck_likes WHERE deck_id = ?', [deckId]);
    await db.run('DELETE FROM deck_comments WHERE deck_id = ?', [deckId]);
    await db.run('DELETE FROM decks WHERE id = ?', [deckId]);

    return NextResponse.json({ success: true, message: 'Mazo eliminado.' });
  } catch (error: any) {
    console.error('Error deleting deck:', error);
    return NextResponse.json({ error: 'Error al eliminar el mazo' }, { status: 500 });
  }
}
