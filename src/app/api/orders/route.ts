import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getStoreStatus, DEFAULT_PAUSE_MESSAGE } from '@/lib/storeSettings';
import { checkRateLimit, recordFailedAttempt, getClientIp, sanitizeText } from '@/lib/security';

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

    const user = getCurrentUser();
    const isLuca = user?.username?.toLowerCase() === 'luca';

    // Public or authenticated tracking by order number
    if (orderNumber) {
      const rawNum = orderNumber.trim();
      const cleanInput = rawNum.toUpperCase().replace('#', '').replace(/\s+/g, '');
      const digitsOnly = cleanInput.replace(/^EAM-?/, '');

      // Only match by sequential DB id if the user is authenticated (prevents unauthenticated ?id=1,2,3 scraping)
      const order = await db.get(
        user
          ? `SELECT * FROM orders 
             WHERE UPPER(TRIM(order_number)) = ? 
                OR UPPER(TRIM(order_number)) = ?
                OR REPLACE(UPPER(TRIM(order_number)), 'EAM-', '') = ?
                OR CAST(id AS TEXT) = ?`
          : `SELECT * FROM orders 
             WHERE UPPER(TRIM(order_number)) = ? 
                OR UPPER(TRIM(order_number)) = ?
                OR REPLACE(UPPER(TRIM(order_number)), 'EAM-', '') = ?`,
        user
          ? [cleanInput, `EAM-${digitsOnly}`, digitsOnly, digitsOnly]
          : [cleanInput, `EAM-${digitsOnly}`, digitsOnly]
      );

      if (!order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
      }

      const isAuthorizedParticipant =
        isLuca ||
        (user &&
          (order.buyer_user_id === user.id ||
            order.seller_id === user.id ||
            order.buyer_name?.toLowerCase() === user.username.toLowerCase() ||
            order.seller_name?.toLowerCase() === user.username.toLowerCase()));

      // If matched only by sequential ID (not by EAM-XXXXX code) and user is not a participant, deny
      const matchedByCode =
        order.order_number?.toUpperCase() === cleanInput ||
        order.order_number?.toUpperCase() === `EAM-${digitsOnly}`;
      if (!matchedByCode && !isAuthorizedParticipant) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
      }

      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

      // Mask buyer phone if requester is not an authenticated participant
      const safeOrder = isAuthorizedParticipant
        ? order
        : {
            ...order,
            buyer_phone: order.buyer_phone
              ? `***${String(order.buyer_phone).slice(-4)}`
              : '',
          };

      return NextResponse.json({ order: safeOrder, items });
    }

    // Admin / Seller / Buyer orders list
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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

    // Rate limit order creation per user/IP (max 12 orders per 10 minutes)
    const ip = getClientIp(request);
    const rateKey = `create-order:${user.id}:${ip}`;
    const rateStatus = checkRateLimit(rateKey, 12, 10 * 60 * 1000);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        { error: `Has realizado demasiados pedidos seguidos. Espera ${rateStatus.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    // Store pause: block new orders server-side (frontend also disables the buttons)
    const storeStatus = await getStoreStatus();
    if (storeStatus.paused) {
      return NextResponse.json(
        { error: storeStatus.message || DEFAULT_PAUSE_MESSAGE, store_paused: true },
        { status: 423 }
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

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return NextResponse.json({ error: 'El pedido no contiene una lista válida de cartas' }, { status: 400 });
    }

    if (!seller_name) {
      return NextResponse.json({ error: 'Falta especificar el vendedor del pedido' }, { status: 400 });
    }

    // Authoritative Server-Side Stock & Price Verification
    const verifiedItems: Array<{
      cardId: number;
      name: string;
      expansion: string;
      number: string;
      version: string;
      is_foil: number;
      is_league: number;
      language: string;
      price: number;
      quantity: number;
      image_url: string;
    }> = [];

    for (const it of items) {
      const cardId = Number(it.id || it.card_id || 0);
      const requestedQty = Math.max(1, Math.min(99, parseInt(String(it.quantity), 10) || 1));

      if (cardId > 0) {
        const dbCard = await db.get('SELECT * FROM cards WHERE id = ?', [cardId]);
        if (!dbCard) {
          return NextResponse.json(
            { error: `La carta "${sanitizeText(it.name, 80) || 'seleccionada'}" ya no existe en el catálogo.` },
            { status: 404 }
          );
        }
        if ((dbCard.stock || 0) < requestedQty) {
          return NextResponse.json(
            {
              error:
                dbCard.stock <= 0
                  ? `La carta "${dbCard.name}" acaba de agotarse.`
                  : `Solo quedan ${dbCard.stock} unidad(es) disponibles de "${dbCard.name}". Ajusta la cantidad en tu carrito.`,
            },
            { status: 409 }
          );
        }

        verifiedItems.push({
          cardId: dbCard.id,
          name: dbCard.name,
          expansion: dbCard.expansion || '',
          number: dbCard.number || '',
          version: dbCard.version || 'Common',
          is_foil: dbCard.is_foil ? 1 : 0,
          is_league: dbCard.is_league ? 1 : 0,
          language: dbCard.language || 'Inglés',
          price: Number(dbCard.price) || 0, // Authoritative DB price
          quantity: requestedQty,
          image_url: dbCard.image_url || '/placeholder-card.svg',
        });
      } else {
        verifiedItems.push({
          cardId: 0,
          name: sanitizeText(it.name || 'Carta Pokémon', 120),
          expansion: sanitizeText(it.expansion || '', 80),
          number: sanitizeText(it.number || '', 30),
          version: sanitizeText(it.version || 'Common', 50),
          is_foil: it.is_foil ? 1 : 0,
          is_league: it.is_league ? 1 : 0,
          language: sanitizeText(it.language || 'Inglés', 30),
          price: Math.max(0, Number(it.price) || 0),
          quantity: requestedQty,
          image_url: it.image_url || '/placeholder-card.svg',
        });
      }
    }

    recordFailedAttempt(rateKey, 10 * 60 * 1000);

    // Use user.username if buyer_name not specified
    const finalBuyerName = sanitizeText(buyer_name, 60) || user.username;
    const cleanBuyerPhone = String(buyer_phone || '').replace(/[^\d+]/g, '').slice(0, 25);
    const cleanSellerName = sanitizeText(seller_name, 60) || 'Luca';
    const cleanSellerPhone = String(seller_phone || '').replace(/[^\d+]/g, '').slice(0, 25);

    // Generate cryptographically random unique official order number: EAM-XXXXX
    const randomSuffix = crypto.randomInt(10000, 100000);
    const orderNumber = `EAM-${randomSuffix}`;

    const totalPrice = verifiedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    const totalItems = verifiedItems.reduce(
      (sum, it) => sum + it.quantity,
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
      cleanSellerName,
      cleanSellerPhone,
      finalBuyerName,
      cleanBuyerPhone,
      totalPrice,
      totalItems,
      now,
      now,
      user.id,
    ]);

    const orderId = orderResult.lastInsertRowid;

    // Insert verified order items AND immediately deduct stock from cards table
    for (const it of verifiedItems) {
      await db.run(`
        INSERT INTO order_items (
          order_id, card_id, name, expansion, number, version, is_foil, is_league, language, price, quantity, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        it.cardId,
        it.name,
        it.expansion,
        it.number,
        it.version,
        it.is_foil,
        it.is_league,
        it.language,
        it.price,
        it.quantity,
        it.image_url,
      ]);

      // Deduct committed stock immediately upon order creation
      if (it.cardId > 0) {
        await db.run(
          'UPDATE cards SET stock = MAX(0, stock - ?), updated_at = ? WHERE id = ?',
          [it.quantity, now, it.cardId]
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
        message: `Tu pedido #${orderNumber} (${totalItems} cartas, $${totalPrice.toLocaleString('es-AR')}) fue enviado a ${cleanSellerName}.`,
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
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
    const isLuca = user.username.toLowerCase() === 'luca';
    const isOwnerSeller =
      order.seller_id === user.id ||
      order.seller_name?.toLowerCase() === user.username.toLowerCase();
    const isOwnerBuyer =
      order.buyer_user_id === user.id ||
      order.buyer_name?.toLowerCase() === user.username.toLowerCase();

    // If buyer/seller is confirming WhatsApp notification check
    if (typeof wa_notified !== 'undefined') {
      if (!isLuca && !isOwnerSeller && !isOwnerBuyer) {
        return NextResponse.json({ error: 'No tienes permiso para modificar este pedido' }, { status: 403 });
      }
      await db.run('UPDATE orders SET wa_notified = ?, updated_at = ? WHERE id = ?', [
        wa_notified ? 1 : 0,
        now,
        id,
      ]);
      const updated = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
      return NextResponse.json({ success: true, order: updated });
    }

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
