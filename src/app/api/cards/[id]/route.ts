import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = parseInt(params.id, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: 'ID de carta inválido' }, { status: 400 });
    }

    const card = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    if (!card) {
      return NextResponse.json({ error: 'Carta no encontrada' }, { status: 404 });
    }

    // Find all offers from other sellers with matching card specs
    const matchingCards = await db.all(`
      SELECT * FROM cards
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
        AND LOWER(TRIM(expansion)) = LOWER(TRIM(?))
        AND LOWER(TRIM(number)) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(version, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(language, ''))) = LOWER(TRIM(?))
        AND COALESCE(is_foil, 0) = ?
        AND COALESCE(is_league, 0) = ?
      ORDER BY price ASC, id DESC
    `, [
      card.name.trim(),
      card.expansion.trim(),
      card.number.trim(),
      (card.version || '').trim(),
      (card.language || '').trim(),
      card.is_foil ? 1 : 0,
      card.is_league ? 1 : 0,
    ]);

    const offers = (matchingCards && matchingCards.length > 0 ? matchingCards : [card]).map((c: any) => ({
      id: c.id,
      seller_id: c.seller_id,
      seller_name: c.seller_name || 'Luca',
      seller_phone: c.seller_phone || '',
      price: c.price,
      stock: c.stock,
      notes: c.notes,
      is_foil: c.is_foil,
      is_league: c.is_league,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    const minPrice = offers[0].price;
    const maxPrice = offers[offers.length - 1].price;
    const totalStock = offers.reduce((acc: number, o: any) => acc + (o.stock || 0), 0);

    return NextResponse.json({
      card: {
        ...card,
        min_price: minPrice,
        max_price: maxPrice,
        total_stock: totalStock,
        offers,
        offers_count: offers.length,
      },
      offers,
    });
  } catch (error: any) {
    console.error('Fetch card [id] error:', error);
    return NextResponse.json({ error: 'Error al obtener la carta' }, { status: 500 });
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

    const isLuca = user.username?.toLowerCase() === 'luca';
    const role = (user.role || '').toLowerCase();
    const canSell = isLuca || role === 'admin' || role === 'owner' || role === 'seller' || role === 'vendedor';

    if (!canSell) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solamente los usuarios con rol Vendedor o Administrador pueden modificar cartas.' },
        { status: 403 }
      );
    }

    const cardId = parseInt(params.id, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: 'ID de carta inválido' }, { status: 400 });
    }

    const body = await request.json();
    const existing = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    if (!existing) {
      return NextResponse.json({ error: 'Carta no encontrada' }, { status: 404 });
    }

    // Ownership check: Luca and Admins can edit any card, regular sellers can only edit their own
    const isOwner = existing.seller_id === user.id || (existing.seller_name && existing.seller_name.toLowerCase() === user.username.toLowerCase());
    if (!isLuca && role !== 'admin' && role !== 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar publicaciones de otros vendedores.' },
        { status: 403 }
      );
    }

    const {
      name,
      expansion,
      number,
      version,
      language,
      artist,
      price,
      stock,
      image_url,
      rarity,
      notes,
      category,
      trainer_type,
      seller_id,
      seller_name,
      seller_phone,
      is_foil,
      is_league,
    } = body;

    const now = new Date().toISOString();

    await db.run(`
      UPDATE cards SET
        name = COALESCE(?, name),
        expansion = COALESCE(?, expansion),
        number = COALESCE(?, number),
        version = COALESCE(?, version),
        language = COALESCE(?, language),
        artist = COALESCE(?, artist),
        price = COALESCE(?, price),
        stock = COALESCE(?, stock),
        image_url = COALESCE(?, image_url),
        rarity = COALESCE(?, rarity),
        notes = COALESCE(?, notes),
        category = COALESCE(?, category),
        trainer_type = COALESCE(?, trainer_type),
        seller_id = COALESCE(?, seller_id),
        seller_name = COALESCE(?, seller_name),
        seller_phone = COALESCE(?, seller_phone),
        is_foil = COALESCE(?, is_foil),
        is_league = COALESCE(?, is_league),
        updated_at = ?
      WHERE id = ?
    `, [
      name !== undefined ? name.trim() : null,
      expansion !== undefined ? expansion.trim() : null,
      number !== undefined ? number.trim() : null,
      version !== undefined ? version.trim() : null,
      language !== undefined ? language.trim() : null,
      artist !== undefined ? artist.trim() : null,
      price !== undefined ? Number(price) : null,
      stock !== undefined ? Math.max(0, parseInt(stock, 10)) : null,
      image_url !== undefined ? image_url.trim() : null,
      rarity !== undefined ? rarity.trim() : null,
      notes !== undefined ? notes.trim() : null,
      category !== undefined ? category.trim() : null,
      trainer_type !== undefined ? trainer_type.trim() : null,
      seller_id !== undefined ? Number(seller_id) : null,
      seller_name !== undefined ? seller_name.trim() : null,
      seller_phone !== undefined ? seller_phone.trim() : null,
      is_foil !== undefined ? (is_foil ? 1 : 0) : null,
      is_league !== undefined ? (is_league ? 1 : 0) : null,
      now,
      cardId
    ]);

    const updated = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    return NextResponse.json({ success: true, card: updated });
  } catch (error: any) {
    console.error('Update card error:', error);
    return NextResponse.json({ error: 'Error al actualizar carta' }, { status: 500 });
  }
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

    const isLuca = user.username?.toLowerCase() === 'luca';
    const role = (user.role || '').toLowerCase();
    const canSell = isLuca || role === 'admin' || role === 'owner' || role === 'seller' || role === 'vendedor';

    if (!canSell) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solamente los usuarios con rol Vendedor o Administrador pueden eliminar cartas.' },
        { status: 403 }
      );
    }

    const cardId = parseInt(params.id, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const existing = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
    if (!existing) {
      return NextResponse.json({ error: 'Carta no encontrada' }, { status: 404 });
    }

    // Ownership check
    const isOwner = existing.seller_id === user.id || (existing.seller_name && existing.seller_name.toLowerCase() === user.username.toLowerCase());
    if (!isLuca && role !== 'admin' && role !== 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar publicaciones de otros vendedores.' },
        { status: 403 }
      );
    }

    await db.run('DELETE FROM cards WHERE id = ?', [cardId]);

    return NextResponse.json({ success: true, message: 'Carta eliminada correctamente' });
  } catch (error: any) {
    console.error('Delete card error:', error);
    return NextResponse.json({ error: 'Error al eliminar carta' }, { status: 500 });
  }
}
