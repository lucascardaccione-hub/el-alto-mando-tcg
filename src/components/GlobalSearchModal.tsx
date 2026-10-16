'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  X,
  ShoppingBag,
  Layers,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
  Sun,
  Moon,
  Command,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { LanguageBadge } from './FlagIcon';
import { CardData } from './CardItem';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const { addToCart, items: cartItems } = useCart();
  const { theme, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<CardData[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedCardId, setAddedCardId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keyboard shortcut Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live search cards & public decks
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      // Load top 4 in-stock cards as suggestions when empty
      setLoading(true);
      Promise.all([
        fetch('/api/cards?limit=4&inStockOnly=true&group=true').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/decks?filter=public').then((r) => (r.ok ? r.json() : null)),
      ])
        .then(([cardData, deckData]) => {
          setCards(cardData?.cards?.slice(0, 4) || []);
          setDecks(deckData?.decks?.slice(0, 3) || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [cardRes, deckRes] = await Promise.all([
          fetch(`/api/cards?q=${encodeURIComponent(trimmed)}&limit=6&group=true`),
          fetch('/api/decks?filter=public'),
        ]);

        if (cardRes.ok) {
          const cData = await cardRes.json();
          setCards(cData.cards || []);
        }
        if (deckRes.ok) {
          const dData = await deckRes.json();
          const qLower = trimmed.toLowerCase();
          const matchedDecks = (dData.decks || [])
            .filter(
              (d: any) =>
                d.name?.toLowerCase().includes(qLower) ||
                d.author_name?.toLowerCase().includes(qLower) ||
                d.format?.toLowerCase().includes(qLower)
            )
            .slice(0, 4);
          setDecks(matchedDecks);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);

  const handleQuickAdd = (card: CardData, e: React.MouseEvent) => {
    e.stopPropagation();
    const existingInCart = cartItems.find((i) => i.id === card.id)?.quantity || 0;
    if (card.stock <= 0 || existingInCart >= card.stock) return;
    addToCart(card, 1);
    setAddedCardId(card.id);
    setTimeout(() => setAddedCardId(null), 1200);
  };

  const navigateTo = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0a1020] border border-blue-500/30 rounded-3xl shadow-2xl shadow-blue-950/50 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-slate-800/90 bg-[#0d1528]">
          {loading ? (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-blue-400 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cartas por nombre, expansión, mazo o código EAM..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800/90 text-slate-400 hover:text-white border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[68vh] overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Direct EAM Order Code Shortcut if user types EAM- or 5 digits */}
          {query.trim() && (/^eam-?\d+/i.test(query.trim()) || /^\d{5}$/.test(query.trim())) && (
            <button
              onClick={() => navigateTo(`/pedidos?numero=${encodeURIComponent(query.trim().toUpperCase())}`)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-300 block">
                    Rastrear Pedido #{query.trim().toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Consultar estado en tiempo real en Seguimiento de Pedidos
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* Store Cards Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>{query.trim() ? 'Cartas en Tienda' : 'Destacadas en Stock'}</span>
              </span>
              <button
                onClick={() => navigateTo(query.trim() ? `/tienda?q=${encodeURIComponent(query.trim())}` : '/tienda')}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Ver catálogo completo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {cards.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center text-xs text-slate-400">
                No se encontraron cartas con &ldquo;{query}&rdquo; en stock.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {cards.map((card) => {
                  const inCart = cartItems.find((i) => i.id === card.id)?.quantity || 0;
                  const maxReached = inCart >= card.stock;
                  return (
                    <div
                      key={card.id}
                      onClick={() => navigateTo('/tienda')}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                          <Image
                            src={card.image_url || '/placeholder-card.svg'}
                            alt={card.name}
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate group-hover:text-blue-400 transition-colors">
                              {card.name}
                            </span>
                            <LanguageBadge language={card.language} size="xs" />
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {card.expansion} #{card.number} · {card.version}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-black text-emerald-400">
                              {formatPrice(card.min_price || card.price)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({card.stock} disp.)
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleQuickAdd(card, e)}
                        disabled={card.stock <= 0 || maxReached}
                        className={`p-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
                          addedCardId === card.id
                            ? 'bg-emerald-600 text-white'
                            : maxReached
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30'
                        }`}
                        title={maxReached ? 'Stock máximo en carrito' : 'Agregar al carrito'}
                      >
                        {addedCardId === card.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <ShoppingBag className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Community Decks Section */}
          {decks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mazos de la Comunidad</span>
                </span>
                <button
                  onClick={() => navigateTo('/decks?tab=community')}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Ver todos</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {decks.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => navigateTo(`/deck-builder/${d.id}`)}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/70 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 text-left transition-all"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate block">
                        {d.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        por @{d.author_name} · {d.total_cards || 60}/60
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation & Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1 block">
              Accesos Rápidos
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => navigateTo('/deck-builder')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Deck Builder</span>
              </button>
              <button
                onClick={() => navigateTo('/pedidos')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Mis Pedidos</span>
              </button>
              <button
                onClick={() => navigateTo('/perfil')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>Mi Perfil</span>
              </button>
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Modo Oscuro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-2.5 bg-[#070b15] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stock y precios verificados en tiempo real</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
            <Command className="w-3 h-3" />
            <span>Ctrl + K para abrir/cerrar</span>
          </span>
        </div>
      </div>
    </div>
  );
}
