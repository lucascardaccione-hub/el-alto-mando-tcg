import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const isLuca = user.username.toLowerCase() === 'luca';
    let query = "SELECT COUNT(*) as unread FROM orders WHERE is_read = 0 AND status != 'cancelado'";
    let params: any[] = [];

    if (!isLuca) {
      query = "SELECT COUNT(*) as unread FROM orders WHERE (seller_id = ? OR LOWER(seller_name) = ?) AND is_read = 0 AND status != 'cancelado'";
      params = [user.id, user.username.toLowerCase()];
    }

    const row = await db.get<{ unread: number }>(query, params);
    return NextResponse.json({ unreadCount: Number(row?.unread || 0) });
  } catch (error) {
    console.error('Error fetching unread orders count:', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}

export async function POST() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isLuca = user.username.toLowerCase() === 'luca';
    if (isLuca) {
      await db.run("UPDATE orders SET is_read = 1 WHERE is_read = 0");
    } else {
      await db.run(
        "UPDATE orders SET is_read = 1 WHERE is_read = 0 AND (seller_id = ? OR LOWER(seller_name) = ?)",
        [user.id, user.username.toLowerCase()]
      );
    }

    return NextResponse.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error('Error marking orders as read:', error);
    return NextResponse.json({ error: 'Error al marcar pedidos como leídos' }, { status: 500 });
  }
}
