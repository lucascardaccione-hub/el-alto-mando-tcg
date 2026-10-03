import db from '@/lib/db';

export type NotificationType =
  | 'deck_like'
  | 'deck_comment'
  | 'deck_rating'
  | 'order_created'
  | 'order_status'
  | 'order_sale'
  | 'reward_badge'
  | 'system';

export interface NotificationItem {
  id: number;
  user_id: number;
  actor_id?: number | null;
  actor_name?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link_url?: string;
  is_read: number;
  created_at: string;
}

export interface CreateNotificationParams {
  userId: number;
  actorId?: number | null;
  actorName?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
}

/**
 * Creates a notification for a user.
 * Automatically skips if the actor is the same as the target user.
 */
export async function createNotification(params: CreateNotificationParams): Promise<number | null> {
  const { userId, actorId, actorName, type, title, message, linkUrl = '' } = params;

  // Don't notify the user of their own actions
  if (actorId && actorId === userId) {
    return null;
  }

  const now = new Date().toISOString();

  try {
    const result = await db.run(`
      INSERT INTO notifications (
        user_id, actor_id, actor_name, type, title, message, link_url, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `, [
      userId,
      actorId || null,
      actorName || null,
      type,
      title,
      message,
      linkUrl,
      now
    ]);

    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Gets recent notifications for a user.
 */
export async function getUserNotifications(userId: number, limit: number = 40): Promise<NotificationItem[]> {
  try {
    const rows = await db.all(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows as NotificationItem[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Gets unread notifications count for a user.
 */
export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  try {
    const row = await db.get(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    return row?.count || 0;
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(id: number, userId: number): Promise<boolean> {
  try {
    await db.run(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: number): Promise<boolean> {
  try {
    await db.run(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `, [userId]);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}
