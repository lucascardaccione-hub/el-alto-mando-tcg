'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Bell,
  Heart,
  MessageCircle,
  Star,
  ShoppingBag,
  CheckCheck,
  Clock,
  Layers,
  Award,
  Truck,
  DollarSign,
  ChevronRight,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { NotificationItem } from '@/lib/notifications';

function formatFullDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'decks' | 'store'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=100');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }

    if (notif.link_url) {
      router.push(notif.link_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'decks') return n.type.startsWith('deck');
    if (filter === 'store') return n.type.startsWith('order');
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deck_like':
        return (
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
            <Heart className="w-5 h-5 fill-rose-500/60" />
          </div>
        );
      case 'deck_comment':
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
            <MessageCircle className="w-5 h-5" />
          </div>
        );
      case 'deck_rating':
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
        );
      case 'order_created':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <ShoppingBag className="w-5 h-5" />
          </div>
        );
      case 'order_sale':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
            <DollarSign className="w-5 h-5" />
          </div>
        );
      case 'order_status':
        return (
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
            <Truck className="w-5 h-5" />
          </div>
        );
      case 'reward_badge':
        return (
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
            <Award className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <Link
              href="/perfil"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Mi Perfil</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span>Centro de Notificaciones</span>
              {unreadCount > 0 && (
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {unreadCount} nuevas
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Interacciones con tus mazos de la comunidad, novedades de la tienda y pedidos de cartas.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all shadow-md active:scale-95"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'unread'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            Sin leer ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('decks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'decks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            Mazos & Comunidad
          </button>
          <button
            type="button"
            onClick={() => setFilter('store')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'store'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            Tienda & Pedidos
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-[#0a0f1d] border border-slate-800/80 rounded-3xl shadow-xl divide-y divide-slate-800/60 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Cargando notificaciones...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Bell className="w-7 h-7 stroke-1" />
              </div>
              <h3 className="text-base font-bold text-white">
                No tienes notificaciones {filter !== 'all' ? 'con este filtro' : ''}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cuando otros entrenadores interactúen con tus mazos, te dejen comentarios o compren singles de tu stock, te avisaremos aquí.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer group ${
                  notif.is_read
                    ? 'bg-transparent hover:bg-slate-900/40'
                    : 'bg-blue-950/20 hover:bg-blue-950/30 border-l-4 border-blue-500'
                }`}
              >
                {getNotificationIcon(notif.type)}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className={`text-sm ${notif.is_read ? 'font-semibold text-slate-200' : 'font-bold text-white'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatFullDate(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.link_url && (
                    <div className="pt-1.5 flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:text-blue-300">
                      <span>Ir al mazo o pedido</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
