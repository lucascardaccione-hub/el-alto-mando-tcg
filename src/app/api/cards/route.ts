import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const expansion = searchParams.get('expansion') || '';
    const artist = searchParams.get('artist') || '';
    const version = searchParams.get('version') || '';
    const language = searchParams.get('language') || '';
    const category = searchParams.get('category') || '';
    const trainerType = searchParams.get('trainerType') || searchParams.get('trainer_type') || '';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const inStockOnly = searchParams.get('inStockOnly') === 'true';
    if (searchParams.get('checkDuplicate') === 'true') {
      const cardName = searchParams.get('name') || '';
      const cardExp = searchParams.get('expansion') || '';
      const cardNum = searchParams.get('number') || '';
      const cardVer = searchParams.get('version') || '';
      const cardLang = searchParams.get('language') || '';
      const cardSellerId = searchParams.get('seller_id') ? Number(searchParams.get('seller_id')) : null;
      const isFoil = searchParams.get('is_foil') === '1' ? 1 : 0;
      const isLeague = searchParams.get('is_league') === '1' ? 1 : 0;

      if (!cardName.trim() || !cardExp.trim() || !cardNum.trim()) {
        return NextResponse.json({ existing: null });
      }

      const existingCard = await db.get(`
        SELECT * FROM cards
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(expansion)) = LOWER(TRIM(?))
          AND LOWER(TRIM(number)) = LOWER(TRIM(?))
          AND LOWER(TRIM(COALESCE(version, ''))) = LOWER(TRIM(?))
          AND LOWER(TRIM(COALESCE(language, ''))) = LOWER(TRIM(?))
          AND COALESCE(is_foil, 0) = ?
          AND COALESCE(is_league, 0) = ?
          AND (? IS NULL OR seller_id = ?)
        ORDER BY id DESC
        LIMIT 1
      `, [
        cardName.trim(),
        cardExp.trim(),
        cardNum.trim(),
        cardVer.trim(),
        cardLang.trim(),
        isFoil,
        isLeague,
        cardSellerId,
        cardSellerId
      ]);

      return NextResponse.json({ existing: existingCard || null });
    }

    const sort = searchParams.get('sort') || 'newest';
    const conditions: string[] = [];
    const params: any[] = [];

    if (search.trim()) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        conditions.push('(name LIKE ? OR expansion LIKE ? OR number LIKE ? OR artist LIKE ? OR version LIKE ?)');
        const term = `%${token}%`;
        params.push(term, term, term, term, term);
      }
    }

    if (expansion.trim()) {
      conditions.push('expansion = ? COLLATE NOCASE');
      params.push(expansion.trim());
    }

    if (category.trim()) {
      const catLower = category.trim().toLowerCase();
      if (catLower === 'pokemon' || catLower === 'pokémon') {
        conditions.push("(LOWER(category) = 'pokemon' OR LOWER(category) = 'pokémon' OR category IS NULL OR category = '')");
      } else if (catLower === 'trainer') {
        conditions.push("LOWER(category) = 'trainer'");
        if (trainerType.trim()) {
          conditions.push('(LOWER(trainer_type) LIKE ? OR LOWER(notes) LIKE ?)');
          const tTerm = `%${trainerType.trim().toLowerCase()}%`;
          params.push(tTerm, tTerm);
        }
      } else if (catLower === 'energy') {
        conditions.push("LOWER(category) = 'energy'");
      } else {
        conditions.push('LOWER(category) = ?');
        params.push(catLower);
      }
    }

    if (artist.trim()) {
      conditions.push('artist = ? COLLATE NOCASE');
      params.push(artist.trim());
    }

    if (version.trim()) {
      conditions.push('version = ? COLLATE NOCASE');
      params.push(version.trim());
    }

    if (language.trim()) {
      conditions.push('language = ? COLLATE NOCASE');
      params.push(language.trim());
    }

    if (minPrice !== null && !isNaN(minPrice)) {
      conditions.push('price >= ?');
      params.push(minPrice);
    }

    if (maxPrice !== null && !isNaN(maxPrice)) {
      conditions.push('price <= ?');
      params.push(maxPrice);
    }

    if (inStockOnly) {
      conditions.push('stock > 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY id DESC';
    if (sort === 'price_asc') {
      orderBy = 'ORDER BY price ASC, id DESC';
    } else if (sort === 'price_desc') {
      orderBy = 'ORDER BY price DESC, id DESC';
    } else if (sort === 'name_asc') {
      orderBy = 'ORDER BY name ASC';
    } else if (sort === 'stock_desc') {
      orderBy = 'ORDER BY stock DESC, id DESC';
    }

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;
    let query = `SELECT * FROM cards ${whereClause} ${orderBy}`;
    if (limit && !isNaN(limit) && limit > 0) {
      query += ` LIMIT ${limit}`;
    }
    const cards = await db.all(query, params);

    return NextResponse.json({
      cards,
      total: cards.length,
    });
  } catch (error: any) {
    console.error('Fetch cards error:', error);
    return NextResponse.json({ error: 'Error al obtener cartas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión en el panel.' }, { status: 401 });
    }

    const isLuca = user.username?.toLowerCase() === 'luca';
    const role = (user.role || '').toLowerCase();
    const canSell = isLuca || role === 'admin' || role === 'owner' || role === 'seller' || role === 'vendedor';

    if (!canSell) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solamente los usuarios con rol Vendedor o Administrador pueden cargar cartas al catálogo. Los Jugadores no tienen permiso de venta.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      expansion,
      number,
      version = 'Común',
      language = 'Inglés',
      artist = 'Desconocido',
      price = 0,
      stock = 1,
      image_url,
      tcg_id = '',
      rarity = '',
      notes = '',
      category = 'Pokemon',
      trainer_type = '',
      seller_id,
      seller_name,
      seller_phone,
      is_foil = 0,
      is_league = 0,
      action, // 'check' | 'merge_keep_price' | 'merge_update_price' | 'create_new'
      target_card_id,
    } = body;

    if (!name || !expansion || !number) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes: Nombre, Colección y Número son obligatorios' },
        { status: 400 }
      );
    }

    // Default to the current logged in user
    let finalSellerId = seller_id ? Number(seller_id) : user.id;
    let finalSellerName = seller_name ? seller_name.trim() : user.username;
    let finalSellerPhone = seller_phone ? seller_phone.trim() : '';

    // If the logged in user is not Luca, force the card seller to be themselves
    if (!isLuca) {
      finalSellerId = user.id;
      finalSellerName = user.username;
    }

    // Lookup seller phone from DB if not passed
    if (!finalSellerPhone && finalSellerId) {
      const sellerUser = await db.get('SELECT phone, username FROM users WHERE id = ?', [finalSellerId]);
      if (sellerUser) {
        finalSellerPhone = sellerUser.phone || '';
        if (!finalSellerName) finalSellerName = sellerUser.username;
      }
    }

    const stockToAdd = Math.max(1, parseInt(stock, 10) || 1);
    const enteredPrice = Number(price) || 0;

    // Check if an existing publication exists for this seller with matching card specs:
    const existingCard = await db.get(`
      SELECT * FROM cards
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
        AND LOWER(TRIM(expansion)) = LOWER(TRIM(?))
        AND LOWER(TRIM(number)) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(version, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(language, ''))) = LOWER(TRIM(?))
        AND COALESCE(is_foil, 0) = ?
        AND COALESCE(is_league, 0) = ?
        AND (seller_id = ? OR (seller_id IS NULL AND LOWER(seller_name) = LOWER(?)))
      ORDER BY id DESC
      LIMIT 1
    `, [
      name.trim(),
      expansion.trim(),
      number.trim(),
      version.trim(),
      language.trim(),
      is_foil ? 1 : 0,
      is_league ? 1 : 0,
      finalSellerId,
      finalSellerName
    ]);

    // Handle existing publication when user has not explicitly requested 'create_new'
    if (existingCard && action !== 'create_new') {
      const targetId = target_card_id ? Number(target_card_id) : existingCard.id;

      if (action === 'merge_keep_price') {
        const newStock = existingCard.stock + stockToAdd;
        const now = new Date().toISOString();
        await db.run('UPDATE cards SET stock = ?, updated_at = ? WHERE id = ?', [
          newStock,
          now,
          targetId
        ]);
        const updatedCard = await db.get('SELECT * FROM cards WHERE id = ?', [targetId]);
        return NextResponse.json({
          success: true,
          merged: true,
          action_taken: 'merge_keep_price',
          card: updatedCard,
          message: `¡Stock actualizado! Se sumaron +${stockToAdd} u. al stock de "${existingCard.name}". Stock total: ${newStock} u. manteniendo el precio de $${existingCard.price.toLocaleString('es-AR')}.`
        });
      }

      if (action === 'merge_update_price') {
        const newStock = existingCard.stock + stockToAdd;
        const newPrice = enteredPrice > 0 ? enteredPrice : existingCard.price;
        const now = new Date().toISOString();
        await db.run('UPDATE cards SET stock = ?, price = ?, updated_at = ? WHERE id = ?', [
          newStock,
          newPrice,
          now,
          targetId
        ]);
        const updatedCard = await db.get('SELECT * FROM cards WHERE id = ?', [targetId]);
        return NextResponse.json({
          success: true,
          merged: true,
          action_taken: 'merge_update_price',
          card: updatedCard,
          message: `¡Stock y precio actualizados! Se sumaron +${stockToAdd} u. a "${existingCard.name}". Stock total: ${newStock} u. con nuevo precio de $${newPrice.toLocaleString('es-AR')}.`
        });
      }

      // If action is not specified, return duplicate detected response for user consultation
      return NextResponse.json({
        duplicate_detected: true,
        existing_card: existingCard,
        stock_to_add: stockToAdd,
        entered_price: enteredPrice,
        message: `Ya tienes ${existingCard.stock} unidad(es) publicada(s) de este artículo a $${existingCard.price.toLocaleString('es-AR')}.`
      });
    }

    const now = new Date().toISOString();
    const result = await db.run(`
      INSERT INTO cards (
        name, expansion, number, version, language, artist, price, stock, image_url, tcg_id, rarity, notes, category, trainer_type, seller_id, seller_name, seller_phone, is_foil, is_league, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      expansion.trim(),
      number.trim(),
      version.trim(),
      language.trim(),
      artist.trim(),
      Number(price) || 0,
      Math.max(0, parseInt(stock, 10) || 0),
      image_url ? image_url.trim() : '/placeholder-card.svg',
      tcg_id ? tcg_id.trim() : '',
      rarity ? rarity.trim() : '',
      notes ? notes.trim() : '',
      category ? category.trim() : 'Pokemon',
      trainer_type ? trainer_type.trim() : '',
      finalSellerId,
      finalSellerName,
      finalSellerPhone,
      is_foil ? 1 : 0,
      is_league ? 1 : 0,
      now,
      now
    ]);

    const newCard = await db.get('SELECT * FROM cards WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({
      success: true,
      card: newCard,
      message: `¡"${name}" agregada con éxito al catálogo con ${stock} unidad(es)!`
    });
  } catch (error: any) {
    console.error('Create card error:', error);
    return NextResponse.json({ error: 'Error al registrar la carta' }, { status: 500 });
  }
}
