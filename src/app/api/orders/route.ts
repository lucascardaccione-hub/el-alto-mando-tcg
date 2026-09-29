import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order_number');

    // Public tracking by order number
    if (orderNumber) {
      const order = await db.get('SELECT * FROM orders WHERE order_number = ?', [orderNumber.trim()]);
      if (!order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
      }
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      return NextResponse.json({ order, items });
    }

    // Admin / Seller orders list
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isLuca = user.username.toLowerCase() === 'luca';
    let query = 'SELECT * FROM orders ORDER BY id DESC';
    let params: any[] = [];

    if (!isLuca) {
      query = 'SELECT * FROM orders WHERE seller_id = ? OR LOWER(seller_name) = ? ORDER BY id DESC';
      params = [user.id, user.username.toLowerCase()];
    }

    const orders = await db.all(query, params);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (ord: any) => {
        const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
        return { ...ord, items };
      })
    );

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      seller_id,
      seller_name,
      seller_phone = '',
      buyer_name = 'Cliente',
      buyer_phone = '',
      items = [],
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El pedido no contiene cartas' }, { status: 400 });
    }

    if (!seller_name) {
      return NextResponse.json({ error: 'Falta especificar el vendedor del pedido' }, { status: 400 });
    }

    // Generate unique official order number: EAM-XXXXX
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `EAM-${randomSuffix}`;

    const totalPrice = items.reduce(
      (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    const totalItems = items.reduce(
      (sum: number, it: any) => sum + (Number(it.quantity) || 1),
      0
    );

    const now = new Date().toISOString();

    const orderResult = await db.run(`
      INSERT INTO orders (
        order_number, seller_id, seller_name, seller_phone, buyer_name, buyer_phone, total_price, total_items, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'solicitado', ?, ?)
    `, [
      orderNumber,
      seller_id ? Number(seller_id) : null,
      seller_name.trim(),
      seller_phone ? seller_phone.trim() : '',
      buyer_name.trim(),
      buyer_phone ? buyer_phone.trim() : '',
      totalPrice,
      totalItems,
      now,
      now,
    ]);

    const orderId = orderResult.lastInsertRowid;

    // Insert order items
    for (const it of items) {
      await db.run(`
        INSERT INTO order_items (
          order_id, card_id, name, expansion, number, version, is_foil, language, price, quantity, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        it.id || it.card_id || 0,
        it.name || 'Carta Pokémon',
        it.expansion || '',
        it.number || '',
        it.version || 'Común',
        it.is_foil ? 1 : 0,
        it.language || 'Inglés',
        Number(it.price) || 0,
        Number(it.quantity) || 1,
        it.image_url || '/placeholder-card.svg',
      ]);
    }

    const createdOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    const createdItems = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    return NextResponse.json({
      success: true,
      order: createdOrder,
      items: createdItems,
      orderNumber,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Error al registrar pedido' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID de pedido y nuevo estado requeridos' }, { status: 400 });
    }

    const validStatuses = ['solicitado', 'en_preparacion', 'preparado'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const isLuca = user.username.toLowerCase() === 'luca';
    const isOwnerSeller = order.seller_id === user.id || order.seller_name.toLowerCase() === user.username.toLowerCase();

    if (!isLuca && !isOwnerSeller) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar este pedido' }, { status: 403 });
    }

    const now = new Date().toISOString();
    await db.run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

    const updated = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Error al actualizar estado del pedido' }, { status: 500 });
  }
}
