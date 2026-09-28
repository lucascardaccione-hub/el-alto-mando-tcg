import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cardId = parseInt(params.id, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: 'ID de carta inválido' }, { status: 400 });
    }

    const body = await request.json();
    const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
    if (!existing) {
      return NextResponse.json({ error: 'Carta no encontrada' }, { status: 404 });
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
    } = body;

    const now = new Date().toISOString();

    const stmt = db.prepare(`
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
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
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
      now,
      cardId
    );

    const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
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

    const cardId = parseInt(params.id, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
    const result = stmt.run(cardId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Carta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Carta eliminada correctamente' });
  } catch (error: any) {
    console.error('Delete card error:', error);
    return NextResponse.json({ error: 'Error al eliminar carta' }, { status: 500 });
  }
}
