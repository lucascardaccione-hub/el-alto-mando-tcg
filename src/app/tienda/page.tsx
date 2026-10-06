'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import FiltersBar from '@/components/FiltersBar';
import CardItem, { CardData } from '@/components/CardItem';
import CartDrawer from '@/components/CartDrawer';
import CardDetailModal from '@/components/CardDetailModal';
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
    document.title = 'Tienda Oficial de Singles — El Alto Mando TCG';
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
  const fetchCards = async () => {
    setLoading(true);
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

      const res = await fetch(`/api/cards?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    } catch (e) {
      console.error('Error fetching cards:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCards();
    }, 250);
    return () => clearTimeout(timer);
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
  };

  const hasActiveFilters = Boolean(
    search || selectedExpansion || selectedCategory || selectedTrainerType || selectedVersion || selectedLanguage || inStockOnly || sort !== 'newest'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      {/* Top Navbar */}
      <Navbar
        totalCards={metadata.stats?.totalCards || cards.length}
        totalStock={metadata.stats?.totalStock || 0}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tienda Header & Tracking Bar */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0a1024]/90 via-[#0d152c]/80 to-[#080d1e]/90 border border-blue-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 -mb-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tienda Oficial de Singles</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-700/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vendedores Verificados</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Catálogo de Cartas Sueltas & Stock en Vivo
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Buscá tus cartas individuales por nombre, número o colección. Comprá directo a vendedores oficiales y completá tus mazos para jugar de inmediato.
              </p>
            </div>

            {/* Quick Actions inside Tienda: Seguimiento de Pedidos */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Link
                href="/pedidos"
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/40 hover:border-amber-500/60 shadow-lg shadow-amber-950/30 transition-all hover:scale-105 active:scale-95"
                title="Consultar estado de tus compras con tu código de pedido"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Seguimiento de Pedidos</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>

              <Link
                href="/deck-builder"
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-blue-200 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-600/40 hover:border-blue-500/60 transition-all hover:scale-105 active:scale-95"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Deck Builder</span>
              </Link>
            </div>
          </div>
        </section>

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

        {/* Catalog Results Header */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 px-1">
          <p>
            Mostrando <strong className="text-white font-bold">{cards.length}</strong>{' '}
            {cards.length === 1 ? 'carta disponible' : 'cartas encontradas'}
          </p>

          <button
            onClick={() => {
              fetchCards();
              fetchMetadata();
            }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
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
        ) : cards.length === 0 ? (
          <div className="bg-[#0c1424] border border-slate-800/80 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No se encontraron cartas</h3>
            <p className="text-xs sm:text-sm text-slate-400">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onOpenModal={(c) => setActiveCardModal(c)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#050811] py-8 text-center text-xs text-slate-500 mt-16">
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
