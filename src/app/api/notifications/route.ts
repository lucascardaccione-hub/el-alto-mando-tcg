import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ notifications: [], unread_count: 0 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const [notifications, unread_count] = await Promise.all([
      getUserNotifications(user.id, limit),
      getUnreadNotificationsCount(user.id),
    ]);

    return NextResponse.json({
      notifications,
      unread_count,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, mark_all } = body;

    if (mark_all) {
      await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    }

    if (id) {
      await markNotificationAsRead(Number(id), user.id);
      return NextResponse.json({ success: true, message: 'Notificación marcada como leída' });
    }

    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Error al actualizar notificaciones' }, { status: 500 });
  }
}
