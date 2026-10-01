'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Star, MessageCircle, Send, Clock, Reply, LogIn } from 'lucide-react';
import { getRoleBadge } from '@/lib/roles';
import { getDefaultAvatar } from '@/lib/avatars';
import Link from 'next/link';

interface DeckSocialSectionProps {
  deckId: number;
  deckName: string;
}

interface AuthUser {
  id: number;
  username: string;
  avatar_url?: string;
  role: string;
}

interface Comment {
  id: number;
  parent_id?: number | null;
  user_id: number;
  content: string;
  rating?: number | null;
  created_at: string;
  updated_at: string;
  // Flat fields from JOIN
  username: string;
  avatar_url?: string | null;
  role: string;
}

export function DeckSocialSection({ deckId, deckName }: DeckSocialSectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.authenticated && data?.user) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    // Fetch likes
    fetch(`/api/decks/${deckId}/likes`)
      .then(res => res.json())
      .then(data => {
        setLikesCount(data.likes_count || 0);
        setHasLiked(data.user_liked || false);
      })
      .catch(() => {});

    fetchComments();
  }, [deckId]);

  const fetchComments = () => {
    fetch(`/api/decks/${deckId}/comments`)
      .then(res => res.json())
      .then(data => {
        const commentsList: Comment[] = data.comments || [];
        setComments(commentsList);

        // Use server-provided stats
        if (data.average_rating != null) {
          setAverageRating(Number(data.average_rating) || 0);
        }
        // Calculate total ratings from comments
        const ratedComments = commentsList.filter(c => c.rating != null && c.rating > 0);
        setTotalRatings(ratedComments.length);

        // Set user's existing rating
        if (data.user_rating) {
          setUserRating(data.user_rating);
        }
      })
      .catch(() => {});
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    if (isLiking) return;

    setIsLiking(true);
    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikesCount(prev => newHasLiked ? prev + 1 : prev - 1);

    try {
      const res = await fetch(`/api/decks/${deckId}/likes`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setHasLiked(data.liked);
        setLikesCount(data.likes_count);
      }
    } catch {
      setHasLiked(!newHasLiked);
      setLikesCount(prev => !newHasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const submitComment = async (content: string, rating: number, parentId: number | null = null) => {
    if (!isAuthenticated || !content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          rating: rating > 0 ? rating : undefined,
          parent_id: parentId,
        }),
      });
      if (res.ok) {
        setNewComment('');
        setSelectedRating(0);
        setReplyTo(null);
        setReplyText('');
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRate = (rating: number) => {
    if (!isAuthenticated) return;
    setUserRating(rating);
    submitComment(`⭐ Calificó este mazo con ${rating} estrella${rating > 1 ? 's' : ''}`, rating);
  };

  const getRelativeTime = (dateString: string) => {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'hace un momento';
    if (diffMin < 60) return `hace ${diffMin}min`;
    if (diffHr < 24) return `hace ${diffHr}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)}sem`;
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  // Group comments for thread display
  const rootComments = comments.filter(c => !c.parent_id);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {} as Record<number, Comment[]>);

  const renderStars = (count: number, size = 'w-4 h-4') =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
      />
    ));

  const renderComment = (c: Comment, isReply: boolean = false) => {
    const avatar = c.avatar_url || getDefaultAvatar(c.username || 'user');
    const roleBadge = getRoleBadge({ username: c.username, role: c.role });

    return (
      <div
        key={c.id}
        className={`p-4 rounded-2xl bg-[#0a0f1d] border border-slate-800/80 ${isReply ? 'ml-8 md:ml-12 border-l-2 border-l-blue-500/30' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <img
              src={avatar}
              alt={c.username}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">{c.username || 'Usuario'}</span>
                {roleBadge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md border ${roleBadge.badgeClass}`}
                  >
                    {roleBadge.icon} {roleBadge.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{getRelativeTime(c.created_at)}</span>
              </div>
            </div>
          </div>
          {c.rating != null && c.rating > 0 && (
            <div className="flex gap-0.5 flex-shrink-0">
              {renderStars(c.rating, 'w-3.5 h-3.5')}
            </div>
          )}
        </div>

        <p className="text-slate-300 text-sm mt-3 whitespace-pre-wrap break-words">
          {c.content}
        </p>

        {!isReply && isAuthenticated && (
          <div className="mt-3">
            <button
              onClick={() => {
                setReplyTo(replyTo === c.id ? null : c.id);
                setReplyText('');
              }}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Reply className="w-3 h-3" />
              Responder
            </button>
          </div>
        )}

        {replyTo === c.id && isAuthenticated && (
          <div className="mt-3 pt-3 border-t border-slate-800/50">
            <textarea
              className="w-full bg-[#111729] text-sm text-white rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Escribí tu respuesta..."
              rows={2}
              maxLength={2000}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-slate-500">{replyText.length}/2000</span>
              <button
                onClick={() => submitComment(replyText, 0, c.id)}
                disabled={isSubmitting || !replyText.trim()}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                Responder
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {repliesByParent[c.id] && repliesByParent[c.id].length > 0 && (
          <div className="mt-3 space-y-3">
            {repliesByParent[c.id].map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Bar: Likes and Ratings */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 bg-[#0a0f1d] border border-white/[0.08] rounded-3xl">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-white/5 transition-all active:scale-95"
          title={isAuthenticated ? (hasLiked ? 'Quitar me gusta' : 'Dar me gusta') : 'Iniciá sesión para dar me gusta'}
        >
          <Heart
            className={`w-6 h-6 transition-all duration-300 ${
              hasLiked
                ? 'fill-rose-500 text-rose-500 scale-110'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          />
          <span className="font-bold text-white text-lg">{likesCount}</span>
          <span className="text-xs text-slate-500 hidden sm:inline">me gusta</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-white font-bold">
              {averageRating > 0 ? averageRating.toFixed(1) : '—'} / 5.0
            </span>
            <span className="text-[11px] text-slate-400">
              {totalRatings} calificacion{totalRatings !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="flex gap-0.5" onMouseLeave={() => setHoverRating(0)}>
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setHoverRating(i + 1)}
                onClick={() => handleRate(i + 1)}
                className="focus:outline-none transition-transform hover:scale-125 p-0.5"
                title={isAuthenticated ? `Calificar ${i + 1} estrella${i > 0 ? 's' : ''}` : 'Iniciá sesión para calificar'}
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    (hoverRating || userRating) > i
                      ? 'fill-amber-400 text-amber-400'
                      : averageRating > i
                        ? 'fill-amber-400/40 text-amber-400/60'
                        : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="p-5 sm:p-6 bg-[#0a0f1d] border border-white/[0.08] rounded-3xl">
        <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          Comentarios
          {comments.length > 0 && (
            <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </h3>

        {isAuthenticated ? (
          <div className="mb-6">
            <textarea
              className="w-full bg-[#111729] text-white rounded-2xl p-4 border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none min-h-[100px] text-sm placeholder:text-slate-500"
              placeholder="Escribí tu comentario sobre este mazo..."
              maxLength={2000}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between mt-3 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500">{newComment.length}/2000</span>
                <div className="flex items-center gap-1 bg-[#111729] px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 mr-1.5">Valorar:</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedRating(selectedRating === i + 1 ? 0 : i + 1)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          selectedRating > i ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => submitComment(newComment, selectedRating)}
                disabled={isSubmitting || !newComment.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-900/30 hover:shadow-lg hover:shadow-blue-800/40 active:scale-95"
              >
                <Send className="w-4 h-4" />
                Publicar Comentario
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-[#111729] rounded-2xl border border-slate-800 border-dashed mb-6">
            <LogIn className="w-8 h-8 text-slate-400 mb-3" />
            <p className="text-slate-300 mb-4 text-center text-sm">
              Iniciá sesión para unirte a la conversación y calificar este mazo.
            </p>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}

        {/* Thread */}
        <div className="space-y-4">
          {rootComments.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">
              Aún no hay comentarios. ¡Sé el primero en opinar! 💬
            </p>
          ) : (
            rootComments.map(c => renderComment(c))
          )}
        </div>
      </div>
    </div>
  );
}
