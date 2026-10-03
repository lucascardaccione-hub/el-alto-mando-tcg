import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deckId = parseInt(params.id, 10);
    if (!deckId) return NextResponse.json({ error: 'ID de mazo inválido' }, { status: 400 });

    const comments = await db.all(`
      SELECT c.*, u.username, u.avatar_url, u.role
      FROM deck_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.deck_id = ?
      ORDER BY c.created_at ASC
    `, [deckId]) as any[];

    const statsResult = await db.get(`
      SELECT 
        COUNT(*) as comments_count, 
        AVG(rating) as average_rating 
      FROM deck_comments 
      WHERE deck_id = ?
    `, [deckId]) as any;

    let userRating = null;
    const user = getCurrentUser();
    if (user) {
      const existingRating = await db.get(`
        SELECT rating FROM deck_comments 
        WHERE deck_id = ? AND user_id = ? AND rating IS NOT NULL
        LIMIT 1
      `, [deckId, user.id]) as any;
      if (existingRating) userRating = existingRating.rating;
    }

    return NextResponse.json({
      comments,
      comments_count: statsResult?.comments_count || 0,
      average_rating: statsResult?.average_rating || null,
      user_rating: userRating,
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deckId = parseInt(params.id, 10);
    if (!deckId) return NextResponse.json({ error: 'ID de mazo inválido' }, { status: 400 });

    const body = await request.json();
    let { content, rating, parent_id } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    content = content.trim();
    if (content.length === 0 || content.length > 2000) {
      return NextResponse.json({ error: 'El contenido debe tener entre 1 y 2000 caracteres' }, { status: 400 });
    }

    // Strip URLs
    content = content.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    content = content.replace(/www\.[\n\S]+/g, '');

    if (rating !== undefined && rating !== null) {
      rating = parseInt(rating as string, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'La calificación debe estar entre 1 y 5' }, { status: 400 });
      }

      // Check for existing rating
      const existingRating = await db.get(`
        SELECT id FROM deck_comments 
        WHERE deck_id = ? AND user_id = ? AND rating IS NOT NULL
      `, [deckId, user.id]) as any;

      if (existingRating) {
        return NextResponse.json({ error: 'Ya has calificado este mazo. Solo puedes calificarlo una vez.' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const result = await db.run(`
      INSERT INTO deck_comments (deck_id, user_id, parent_id, content, rating, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [deckId, user.id, parent_id || null, content, rating || null, now, now]);

    const newCommentId = result.lastInsertRowid;
    const newComment = await db.get(`
      SELECT c.*, u.username, u.avatar_url, u.role
      FROM deck_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [newCommentId]);

    // Send notifications to deck owner and parent comment author
    try {
      const { createNotification } = await import('@/lib/notifications');
      const deck = await db.get(`SELECT user_id, name FROM decks WHERE id = ?`, [deckId]) as any;

      if (deck && deck.user_id) {
        // If parent_id is present, it's a reply
        if (parent_id) {
          const parentComment = await db.get(`SELECT user_id FROM deck_comments WHERE id = ?`, [parent_id]) as any;
          if (parentComment && parentComment.user_id && parentComment.user_id !== user.id) {
            await createNotification({
              userId: parentComment.user_id,
              actorId: user.id,
              actorName: user.username,
              type: 'deck_comment',
              title: 'Nueva respuesta a tu comentario',
              message: `@${user.username} respondió a tu comentario en "${deck.name}": "${content.slice(0, 75)}${content.length > 75 ? '...' : ''}"`,
              linkUrl: `/deck-builder/${deckId}`,
            });
          }
        }

        // Notify deck owner if not commenting on their own deck
        if (deck.user_id !== user.id) {
          const notifType = rating ? 'deck_rating' : 'deck_comment';
          const notifTitle = rating ? '¡Nueva calificación en tu mazo!' : 'Nuevo comentario en tu mazo';
          const notifMsg = rating
            ? `@${user.username} calificó tu mazo "${deck.name}" con ${rating} estrellas ⭐.`
            : `@${user.username} comentó en tu mazo "${deck.name}": "${content.slice(0, 75)}${content.length > 75 ? '...' : ''}"`;

          await createNotification({
            userId: deck.user_id,
            actorId: user.id,
            actorName: user.username,
            type: notifType,
            title: notifTitle,
            message: notifMsg,
            linkUrl: `/deck-builder/${deckId}`,
          });
        }
      }
    } catch (notifErr) {
      console.error('Error sending comment notification:', notifErr);
    }

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error al crear el comentario' }, { status: 500 });
  }
}
