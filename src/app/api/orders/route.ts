import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber =
      searchParams.get('order_number') ||
      searchParams.get('numero') ||
      searchParams.get('code') ||
      searchParams.get('nro') ||
      searchParams.get('id');

    // Public tracking by order number or ID
    if (orderNumber) {
      const rawNum = orderNumber.trim();
      const cleanInput = rawNum.toUpperCase().replace('#', '').replace(/\s+/g, '');
      const digitsOnly = cleanInput.replace(/^EAM-?/, '');

      const order = await db.get(
        `SELECT * FROM orders 
         WHERE UPPER(TRIM(order_number)) = ? 
            OR UPPER(TRIM(order_number)) = ?
            OR REPLACE(UPPER(TRIM(order_number)), 'EAM-', '') = ?
            OR CAST(id AS TEXT) = ?`,
        [cleanInput, `EAM-${digitsOnly}`, digitsOnly, digitsOnly]
      );

      if (!order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
      }
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      return NextResponse.json({ order, items });
    }

    // Admin / Seller / Buyer orders list
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isLuca = user.username.toLowerCase() === 'luca';
    let query = 'SELECT * FROM orders ORDER BY id DESC';
    let params: any[] = [];

    if (!isLuca) {
      query = 'SELECT * FROM orders WHERE seller_id = ? OR LOWER(seller_name) = ? OR buyer_user_id = ? OR LOWER(buyer_name) = ? ORDER BY id DESC';
      params = [user.id, user.username.toLowerCase(), user.id, user.username.toLowerCase()];
    }

    const orders = await db.all(query, params);

    // Optional mark all as read
    if (searchParams.get('mark_read') === 'true') {
      if (isLuca) {
        await db.run("UPDATE orders SET is_read = 1 WHERE is_read = 0");
      } else {
        await db.run(
          "UPDATE orders SET is_read = 1 WHERE is_read = 0 AND (seller_id = ? OR LOWER(seller_name) = ?)",
          [user.id, user.username.toLowerCase()]
        );
      }
    }

    // Calculate unread count
    const unreadRow = await db.get<{ unread: number }>(
      isLuca
        ? "SELECT COUNT(*) as unread FROM orders WHERE is_read = 0 AND status != 'cancelado'"
        : "SELECT COUNT(*) as unread FROM orders WHERE (seller_id = ? OR LOWER(seller_name) = ?) AND is_read = 0 AND status != 'cancelado'",
      isLuca ? [] : [user.id, user.username.toLowerCase()]
    );
    const unreadCount = Number(unreadRow?.unread || 0);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (ord: any) => {
        const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
        return { ...ord, items };
      })
    );

    return NextResponse.json({ orders: ordersWithItems, unreadCount });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // REQUIREMENT 1: User MUST be registered and authenticated to make an order
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Para hacer un pedido debes estar registrado e iniciar sesión.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      seller_id,
      seller_name,
      seller_phone = '',
      buyer_name,
      buyer_phone = '',
      items = [],
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El pedido no contiene cartas' }, { status: 400 });
    }

    if (!seller_name) {
      return NextResponse.json({ error: 'Falta especificar el vendedor del pedido' }, { status: 400 });
    }

    // Use user.username if buyer_name not specified
    const finalBuyerName = (buyer_name && buyer_name.trim()) ? buyer_name.trim() : user.username;

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
        order_number, seller_id, seller_name, seller_phone, buyer_name, buyer_phone, total_price, total_items, status, created_at, updated_at, buyer_user_id, wa_notified, cancel_reason, is_read, stock_deducted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'solicitado', ?, ?, ?, 0, '', 0, 1)
    `, [
      orderNumber,
      seller_id ? Number(seller_id) : null,
      seller_name.trim(),
      seller_phone ? seller_phone.trim() : '',
      finalBuyerName,
      buyer_phone ? buyer_phone.trim() : '',
      totalPrice,
      totalItems,
      now,
      now,
      user.id,
    ]);

    const orderId = orderResult.lastInsertRowid;

    // Insert order items AND immediately deduct stock from cards table
    for (const it of items) {
      const cardId = it.id || it.card_id || 0;
      const qty = Number(it.quantity) || 1;

      await db.run(`
        INSERT INTO order_items (
          order_id, card_id, name, expansion, number, version, is_foil, is_league, language, price, quantity, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        cardId,
        it.name || 'Carta Pokémon',
        it.expansion || '',
        it.number || '',
        it.version || 'Common',
        it.is_foil ? 1 : 0,
        it.is_league ? 1 : 0,
        it.language || 'Inglés',
        Number(it.price) || 0,
        qty,
        it.image_url || '/placeholder-card.svg',
      ]);

      // Deduct committed stock immediately upon order creation
      if (cardId > 0) {
        await db.run(
          'UPDATE cards SET stock = MAX(0, stock - ?), updated_at = ? WHERE id = ?',
          [qty, now, cardId]
        );
      }
    }

    const createdOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    const createdItems = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    // Send notifications to buyer and seller
    try {
      const { createNotification } = await import('@/lib/notifications');
      // Buyer notification
      await createNotification({
        userId: user.id,
        type: 'order_created',
        title: '¡Pedido registrado con éxito!',
        message: `Tu pedido #${orderNumber} (${totalItems} cartas, $${totalPrice.toLocaleString('es-AR')}) fue enviado a ${seller_name.trim()}.`,
        linkUrl: `/pedidos?numero=${orderNumber}`,
      });

      // Seller notification
      if (seller_id) {
        await createNotification({
          userId: Number(seller_id),
          actorId: user.id,
          actorName: user.username,
          type: 'order_sale',
          title: '¡Nueva venta en Tienda!',
          message: `@${finalBuyerName} ordenó ${totalItems} carta(s) por $${totalPrice.toLocaleString('es-AR')} en el pedido #${orderNumber}.`,
          linkUrl: `/admin/orders`,
        });
      }
    } catch (notifErr) {
      console.error('Error sending order notification:', notifErr);
    }

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
    const body = await request.json();
    const { id, status, wa_notified, cancel_reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // If buyer is confirming WhatsApp notification check
    if (typeof wa_notified !== 'undefined') {
      await db.run('UPDATE orders SET wa_notified = ?, updated_at = ? WHERE id = ?', [
        wa_notified ? 1 : 0,
        now,
        id,
      ]);
      const updated = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
      return NextResponse.json({ success: true, order: updated });
    }

    // Status update requires seller or Luca permissions
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isLuca = user.username.toLowerCase() === 'luca';
    const isOwnerSeller =
      order.seller_id === user.id ||
      order.seller_name.toLowerCase() === user.username.toLowerCase();

    if (!isLuca && !isOwnerSeller) {
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar este pedido' },
        { status: 403 }
      );
    }

    const validStatuses = ['solicitado', 'en_preparacion', 'preparado', 'entregado', 'cancelado'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    if (status === 'cancelado') {
      // If order had deducted stock, replenish / restore it to the store
      if (order.stock_deducted === 1) {
        const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);
        for (const it of items) {
          if (it.card_id && it.card_id > 0) {
            await db.run(
              'UPDATE cards SET stock = stock + ?, updated_at = ? WHERE id = ?',
              [it.quantity || 1, now, it.card_id]
            );
          }
        }
      }

      const finalReason = cancel_reason?.trim() || 'Cancelado por el vendedor';
      await db.run(
        'UPDATE orders SET status = ?, cancel_reason = ?, stock_deducted = 0, updated_at = ? WHERE id = ?',
        ['cancelado', finalReason, now, id]
      );
    } else if (status) {
      // If re-opening from cancelled, re-deduct the stock
      if (order.status === 'cancelado' || !order.stock_deducted || order.stock_deducted === 0) {
        const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);
        for (const it of items) {
          if (it.card_id && it.card_id > 0) {
            await db.run(
              'UPDATE cards SET stock = MAX(0, stock - ?), updated_at = ? WHERE id = ?',
              [it.quantity || 1, now, it.card_id]
            );
          }
        }
      }

      await db.run(
        'UPDATE orders SET status = ?, stock_deducted = 1, updated_at = ? WHERE id = ?',
        [status, now, id]
      );
    }

    const updated = await db.get('SELECT * FROM orders WHERE id = ?', [id]);

    // Send notification to buyer on status update
    try {
      if (order.buyer_user_id && status && status !== order.status) {
        const { createNotification } = await import('@/lib/notifications');
        const statusMap: Record<string, string> = {
          solicitado: 'Solicitado',
          en_preparacion: 'En Preparación',
          preparado: 'Preparado para Entrega',
          entregado: 'Entregado / Completado',
          cancelado: 'Cancelado',
        };
        const statusText = statusMap[status] || status;
        await createNotification({
          userId: order.buyer_user_id,
          actorId: user.id,
          actorName: user.username,
          type: 'order_status',
          title: `Actualización de tu pedido #${order.order_number}`,
          message: `El estado de tu pedido #${order.order_number} ahora es: "${statusText}".`,
          linkUrl: `/pedidos?numero=${order.order_number}`,
        });
      }
    } catch (notifErr) {
      console.error('Error sending order status notification:', notifErr);
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let reason = searchParams.get('reason');
    let permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
        reason = body.reason;
        permanent = !!body.permanent;
      } catch {
        // query params only
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const isLuca = user.username.toLowerCase() === 'luca';
    const isOwnerSeller =
      order.seller_id === user.id ||
      order.seller_name.toLowerCase() === user.username.toLowerCase();

    if (!isLuca && !isOwnerSeller) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este pedido' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // If stock was already deducted and we are deleting, restore stock
    if (order.stock_deducted === 1) {
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);
      for (const it of items) {
        if (it.card_id && it.card_id > 0) {
          await db.run('UPDATE cards SET stock = stock + ?, updated_at = ? WHERE id = ?', [
            it.quantity || 1,
            now,
            it.card_id,
          ]);
        }
      }
    }

    if (permanent) {
      if (!isLuca) {
        return NextResponse.json(
          { error: 'Solo el Administrador Master Luca puede eliminar pedidos definitivamente del sistema.' },
          { status: 403 }
        );
      }
      await db.run('DELETE FROM order_items WHERE order_id = ?', [id]);
      await db.run('DELETE FROM orders WHERE id = ?', [id]);
      return NextResponse.json({ success: true, deleted: true });
    } else {
      // By default mark as cancelado with the specified reason
      const cancelReason = reason?.trim() || 'Cancelado por el vendedor';
      await db.run(
        'UPDATE orders SET status = ?, cancel_reason = ?, stock_deducted = 0, updated_at = ? WHERE id = ?',
        ['cancelado', cancelReason, now, id]
      );
      return NextResponse.json({ success: true, orderId: id, status: 'cancelado', cancelReason });
    }
  } catch (error: any) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: 'Error al eliminar pedido' }, { status: 500 });
  }
}
