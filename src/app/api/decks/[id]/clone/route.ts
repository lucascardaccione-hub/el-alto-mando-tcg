import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para crear una copia de este mazo.' },
        { status: 401 }
      );
    }

    const deckId = parseInt(params.id, 10);
    if (!deckId) {
      return NextResponse.json({ error: 'ID de mazo inválido' }, { status: 400 });
    }

    const deck = (await db.get('SELECT * FROM decks WHERE id = ?', [deckId])) as any;
    if (!deck) {
      return NextResponse.json({ error: 'Mazo no encontrado' }, { status: 404 });
    }

    const isOwner = deck.user_id === user.id;
    const isLuca =
      user.username?.toLowerCase() === 'luca' ||
      user.email?.toLowerCase().includes('luca') ||
      user.role === 'admin';

    // Must be a public deck or belong to user/admin
    if (!deck.is_public && !isOwner && !isLuca) {
      return NextResponse.json(
        { error: 'Este mazo es privado y no puede ser copiado.' },
        { status: 403 }
      );
    }

    const cards = (await db.all(
      'SELECT * FROM deck_cards WHERE deck_id = ? ORDER BY id ASC',
      [deckId]
    )) as any[];

    const now = new Date().toISOString();
    const copyName = isOwner
      ? `Copia de ${deck.name}`
      : (deck.name.toLowerCase().startsWith('copia de') ? deck.name : `Copia de ${deck.name}`);

    const newDeckResult = (await db.run(
      `INSERT INTO decks (user_id, name, format, description, is_public, cover_card_image, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        user.id,
        copyName,
        deck.format,
        deck.description || '',
        deck.cover_card_image || '',
        now,
        now,
      ]
    )) as any;

    const newDeckId = newDeckResult.lastInsertRowid;

    if (cards && cards.length > 0) {
      const cardBatch = cards.map((c) => ({
        sql: `INSERT INTO deck_cards (deck_id, card_name, expansion, number, category, trainer_type, count, owned_count, image_url, tcg_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          newDeckId,
          c.card_name,
          c.expansion,
          c.number,
          c.category,
          c.trainer_type || '',
          c.count,
          0, // Reset owned count for new user
          c.image_url,
          c.tcg_id || '',
        ],
      }));
      await db.batch(cardBatch);
    }

    return NextResponse.json({
      success: true,
      deckId: newDeckId,
      name: copyName,
      message: '¡Copia creada con éxito en Mis Mazos!',
    });
  } catch (error: any) {
    console.error('Error cloning deck:', error);
    return NextResponse.json({ error: 'Error al duplicar el mazo' }, { status: 500 });
  }
}
