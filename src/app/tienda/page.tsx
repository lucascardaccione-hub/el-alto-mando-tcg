'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import FiltersBar from '@/components/FiltersBar';
import CardItem, { CardData } from '@/components/CardItem';
import CartDrawer from '@/components/CartDrawer';
import CardDetailModal from '@/components/CardDetailModal';
import StorePausedBanner from '@/components/StorePausedBanner';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  Layers,
  ArrowRight,
  Clock,
  ShoppingBag,
  ShieldCheck,
  Search,
} from 'lucide-react';

export default function TiendaPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 24;

  const [metadata, setMetadata] = useState<{
    expansions: string[];
    artists: string[];
    versions: string[];
    languages: string[];
    stats: { totalCards: number; totalStock: number; totalExpansions: number };
  }>({
    expansions: [],
    artists: [],
    versions: [],
    languages: ['Inglés', 'Español'],
    stats: { totalCards: 0, totalStock: 0, totalExpansions: 0 },
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTrainerType, setSelectedTrainerType] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Modal State
  const [activeCardModal, setActiveCardModal] = useState<CardData | null>(null);

  useEffect(() => {
    document.title = 'Catálogo de Cartas Sueltas — El Alto Mando TCG';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qParam = params.get('q') || params.get('search');
      if (qParam) setSearch(qParam);
    }
  }, []);

  // Fetch filter metadata (expansions, versions)
  const fetchMetadata = async () => {
    try {
      const res = await fetch('/api/expansions');
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
      }
    } catch (e) {
      console.error('Error fetching metadata:', e);
    }
  };

  // Fetch cards with active filters
  const fetchCards = async (signal?: AbortSignal) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());
      if (selectedExpansion) params.append('expansion', selectedExpansion);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedTrainerType) params.append('trainerType', selectedTrainerType);
      if (selectedVersion) params.append('version', selectedVersion);
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (inStockOnly) params.append('inStockOnly', 'true');
      if (sort) params.append('sort', sort);
      params.append('group', 'true');

      const res = await fetch(`/api/cards?${params.toString()}`, { signal });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'No se pudo cargar el catálogo de cartas.');
      }
      const data = await res.json();
      setCards(data.cards || []);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('Error fetching cards:', e);
      setFetchError(e?.message || 'Error de conexión al cargar el catálogo.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    const controller = new AbortController();
    const delay = search.trim() ? 220 : 0;
    const timer = setTimeout(() => {
      fetchCards(controller.signal);
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, selectedExpansion, selectedCategory, selectedTrainerType, selectedVersion, selectedLanguage, sort, inStockOnly]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedExpansion('');
    setSelectedCategory('');
    setSelectedTrainerType('');
    setSelectedVersion('');
    setSelectedLanguage('');
    setSort('newest');
    setInStockOnly(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search || selectedExpansion || selectedCategory || selectedTrainerType || selectedVersion || selectedLanguage || inStockOnly || sort !== 'newest'
  );

  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const paginatedCards = cards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <Navbar
        totalCards={metadata.stats?.totalCards || cards.length}
        totalStock={metadata.stats?.totalStock || 0}
      />

      {/* Main Content */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <StorePausedBanner />
        {/* Tienda Header & Tracking Bar */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-slate-50 dark:from-[#0a1024]/90 dark:via-[#0d152c]/80 dark:to-[#080d1e]/90 border border-slate-200 dark:border-blue-500/20 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 -mb-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Catálogo de Cartas Sueltas</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Vendedores Verificados</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Catálogo de Cartas Sueltas & Stock en Vivo
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Buscá tus cartas individuales por nombre, número o colección. Comprá directo a vendedores verificados de la comunidad y completá tus mazos.
              </p>
            </div>

            {/* Quick Actions inside Tienda: Seguimiento de Pedidos */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Link
                href="/pedidos"
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-200 bg-amber-500/15 dark:bg-amber-950/40 hover:bg-amber-500/25 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-600/40 hover:border-amber-400 dark:hover:border-amber-500/60 shadow-sm dark:shadow-lg dark:shadow-amber-950/30 transition-all hover:scale-105 active:scale-95"
                title="Consultar estado de tus compras con tu código de pedido"
              >
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Seguimiento de Pedidos</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </Link>

              <Link
                href="/deck-builder"
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-blue-800 dark:text-blue-200 bg-blue-500/15 dark:bg-blue-950/40 hover:bg-blue-500/25 dark:hover:bg-blue-900/50 border border-blue-300 dark:border-blue-600/40 hover:border-blue-400 dark:hover:border-blue-500/60 transition-all hover:scale-105 active:scale-95"
              >
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Deck Builder</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: '', label: 'Todas las Cartas', emoji: '🃏' },
            { id: 'Pokemon', label: 'Pokémon', emoji: '⚡' },
            { id: 'Trainer', label: 'Entrenadores', emoji: '🎒' },
            { id: 'Energy', label: 'Energías', emoji: '🔥' },
          ].map((cat) => {
            const active = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id || 'all'}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (cat.id !== 'Trainer') setSelectedTrainerType('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-400/40'
                    : 'bg-white dark:bg-[#0b1220] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters Toolbar */}
        <FiltersBar
          search={search}
          setSearch={setSearch}
          selectedExpansion={selectedExpansion}
          setSelectedExpansion={setSelectedExpansion}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTrainerType={selectedTrainerType}
          setSelectedTrainerType={setSelectedTrainerType}
          selectedVersion={selectedVersion}
          setSelectedVersion={setSelectedVersion}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          sort={sort}
          setSort={setSort}
          inStockOnly={inStockOnly}
          setInStockOnly={setInStockOnly}
          expansions={metadata.expansions}
          versions={metadata.versions}
          languages={metadata.languages}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Active Filter Chips & Catalog Results Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 px-1">
          <div className="flex flex-wrap items-center gap-2">
            {loading ? (
              <p className="text-slate-500 dark:text-slate-400">Cargando catálogo...</p>
            ) : (
              <p>
                Mostrando <strong className="text-slate-900 dark:text-white font-bold">{cards.length}</strong>{' '}
                {cards.length === 1 ? 'carta disponible' : 'cartas encontradas'}
              </p>
            )}
            {search && (
              <button
                onClick={() => setSearch('')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/60"
              >
                <span>Búsqueda: &ldquo;{search}&rdquo;</span>
                <span className="ml-1 font-bold">×</span>
              </button>
            )}
            {selectedExpansion && (
              <button
                onClick={() => setSelectedExpansion('')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              >
                <span>Set: {selectedExpansion}</span>
                <span className="ml-1 font-bold">×</span>
              </button>
            )}
            {selectedVersion && (
              <button
                onClick={() => setSelectedVersion('')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 hover:bg-purple-100 dark:hover:bg-purple-900/60"
              >
                <span>Rareza: {selectedVersion}</span>
                <span className="ml-1 font-bold">×</span>
              </button>
            )}
            {selectedLanguage && (
              <button
                onClick={() => setSelectedLanguage('')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
              >
                <span>Idioma: {selectedLanguage}</span>
                <span className="ml-1 font-bold">×</span>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              fetchCards();
              fetchMetadata();
            }}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 aspect-[2.5/4] animate-pulse flex flex-col justify-between"
              >
                <div className="w-full aspect-[2.5/3.5] bg-slate-800/50 rounded-xl" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div role="alert" className="bg-white dark:bg-[#0c1424] border border-rose-300 dark:border-rose-800/80 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-8 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Error al cargar el catálogo</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={() => fetchCards()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron cartas</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              No hay cartas que coincidan con los filtros seleccionados o el stock se encuentra agotado.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-colors"
              >
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
              {paginatedCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  onOpenModal={(c) => setActiveCardModal(c)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Paginación del catálogo" className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500 disabled:opacity-40 transition-all"
                >
                  Anterior
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Página <strong className="text-slate-900 dark:text-white">{currentPage}</strong> de{' '}
                  <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500 disabled:opacity-40 transition-all"
                >
                  Siguiente
                </button>
              </nav>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#050811] py-8 text-center text-xs text-slate-500 mt-16">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-400">
            El Alto Mando TCG © {new Date().getFullYear()} — Coleccionismo & Juego Competitivo
          </p>
          <p className="text-[11px]">
            Pokémon y sus respectivas marcas son marcas registradas de Nintendo, Game Freak y Creatures Inc.
          </p>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Card Detail Modal */}
      <CardDetailModal
        card={activeCardModal}
        onClose={() => setActiveCardModal(null)}
        onCardUpdated={(updated) => {
          setCards((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          );
          fetchCards();
        }}
      />
    </div>
  );
}
