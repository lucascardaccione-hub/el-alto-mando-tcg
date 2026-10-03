'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ExternalLink,
  Check,
  ChevronRight,
} from 'lucide-react';
import { NotificationItem } from '@/lib/notifications';

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Hace instantes';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return 'Ayer';
    if (days < 30) return `Hace ${days} d`;
    return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'decks' | 'store'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=40');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 18 seconds for real-time alerts
    const interval = setInterval(fetchNotifications, 18000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      setIsOpen(false);
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
    if (activeTab === 'decks') {
      return n.type.startsWith('deck');
    }
    if (activeTab === 'store') {
      return n.type.startsWith('order');
    }
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deck_like':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
            <Heart className="w-4 h-4 fill-rose-500/60" />
          </div>
        );
      case 'deck_comment':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
            <MessageCircle className="w-4 h-4" />
          </div>
        );
      case 'deck_rating':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
        );
      case 'order_created':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
      case 'order_sale':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
            <DollarSign className="w-4 h-4" />
          </div>
        );
      case 'order_status':
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
            <Truck className="w-4 h-4" />
          </div>
        );
      case 'reward_badge':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
            <Award className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`relative p-2 rounded-2xl text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border transition-all ${
          isOpen
            ? 'border-blue-500/60 shadow-lg shadow-blue-900/30 text-white'
            : 'border-white/[0.08] hover:border-white/[0.15]'
        }`}
        title="Notificaciones"
        aria-label="Abrir notificaciones"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-full border border-red-400/60 shadow-lg shadow-red-950/60 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2.5 w-[330px] sm:w-[380px] rounded-3xl bg-[#090e1c] border border-blue-500/30 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Notificaciones</span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {unreadCount} nueva(s)
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Al día</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1.5 bg-slate-950/40 border-b border-slate-800/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1 rounded-xl font-bold transition-all text-center text-[11px] ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('decks')}
              className={`flex-1 py-1 rounded-xl font-bold transition-all text-center text-[11px] ${
                activeTab === 'decks'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mazos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className={`flex-1 py-1 rounded-xl font-bold transition-all text-center text-[11px] ${
                activeTab === 'store'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tienda
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
                <p className="text-xs font-semibold text-slate-300">
                  No tienes notificaciones {activeTab !== 'all' ? 'en esta categoría' : ''}
                </p>
                <p className="text-[11px] text-slate-500">
                  Aquí verás cuando alguien califique o comente tus mazos, o tus compras en tienda.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    notif.is_read
                      ? 'bg-transparent hover:bg-slate-900/60'
                      : 'bg-blue-950/25 hover:bg-blue-950/40 border-l-2 border-blue-500'
                  }`}
                >
                  {getNotificationIcon(notif.type)}

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${notif.is_read ? 'font-medium text-slate-200' : 'font-bold text-white'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-500 flex-shrink-0 whitespace-nowrap">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link_url && (
                      <div className="pt-0.5 flex items-center gap-1 text-[10px] font-semibold text-blue-400 group-hover:text-blue-300">
                        <span>Ver detalles</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-800/80 bg-slate-950/80 text-center">
            <Link
              href="/notificaciones"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
            >
              Ver centro completo de notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
