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

    const query = `SELECT * FROM cards ${whereClause} ${orderBy}`;
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
    } = body;

    if (!name || !expansion || !number) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes: Nombre, Colección y Número son obligatorios' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const result = await db.run(`
      INSERT INTO cards (
        name, expansion, number, version, language, artist, price, stock, image_url, tcg_id, rarity, notes, category, trainer_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      now,
      now
    ]);

    const newCard = await db.get('SELECT * FROM cards WHERE id = ?', [result.lastInsertRowid]);

    return NextResponse.json({
      success: true,
      card: newCard,
    });
  } catch (error: any) {
    console.error('Create card error:', error);
    return NextResponse.json({ error: 'Error al registrar la carta' }, { status: 500 });
  }
}
