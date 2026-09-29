'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import FiltersBar from '@/components/FiltersBar';
import CardItem, { CardData } from '@/components/CardItem';
import CartDrawer from '@/components/CartDrawer';
import CardDetailModal from '@/components/CardDetailModal';
import { Sparkles, RefreshCw, AlertCircle, Layers, Globe, ArrowRight } from 'lucide-react';

export default function HomePage() {
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
    document.title = 'Tienda — El Alto Mando TCG';
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
        {/* Minimalist Hero Section */}
        <section className="relative rounded-3xl overflow-hidden bg-[#0a0f1d]/90 border border-white/[0.08] p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Subtle sapphire ambient glow */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-600/[0.08] blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-24 w-80 h-80 rounded-full bg-blue-500/[0.05] blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Left Column: Heading, Value Prop & Quick Action CTAs */}
            <div className="space-y-5 text-center lg:text-left flex-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>Tienda Oficial & Catálogo de Cartas</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Tienda — <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">El Alto Mando TCG</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                Catálogo y Stock Oficial de Cartas Pokémon singles, versiones Holo, Reverse y Secret Rares con disponibilidad en tiempo real. Crea tus mazos y conéctate con la comunidad competitiva.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  href="/deck-builder"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 shadow-lg shadow-blue-900/30 border border-blue-400/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Layers className="w-4 h-4 text-blue-200" />
                  <span>Armar Mazo (Deck Builder)</span>
                  <ArrowRight className="w-4 h-4 text-blue-200" />
                </Link>

                <Link
                  href="/decks"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Decks de la Comunidad</span>
                </Link>
              </div>
            </div>

            {/* Right Column: 3D Holographic Card Fan Showcase */}
            <div className="flex-shrink-0 relative flex items-center justify-center py-6 px-4 select-none">
              {/* Backlight Radial Glow */}
              <div className="absolute w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex items-center justify-center">
                {/* Left Card: Charizard ex */}
                <div className="relative w-28 sm:w-32 aspect-[2.5/3.5] -mr-10 -rotate-12 transform hover:-translate-y-3 hover:rotate-[-8deg] transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950 group cursor-pointer">
                  <img
                    src="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/OBF/OBF_125_R_EN_SM.png"
                    alt="Charizard ex"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Center Main Card: Teal Mask Ogerpon ex */}
                <div className="relative z-20 w-32 sm:w-36 aspect-[2.5/3.5] -translate-y-3 transform hover:-translate-y-5 transition-all duration-300 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.4)] border-2 border-blue-400/40 bg-slate-950 group cursor-pointer">
                  <img
                    src="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/TWM/TWM_025_R_EN_SM.png"
                    alt="Teal Mask Ogerpon ex"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/10 via-white/20 to-transparent pointer-events-none" />

                  {/* Floating Pill Badge */}
                  <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-white/20 text-center shadow-lg">
                    <span className="text-[10px] font-black text-blue-300 tracking-wider uppercase block">
                      ⚡ 60 Cartas · PTCGL
                    </span>
                  </div>
                </div>

                {/* Right Card: Fezandipiti ex */}
                <div className="relative z-10 w-28 sm:w-32 aspect-[2.5/3.5] -ml-10 rotate-12 transform hover:-translate-y-3 hover:rotate-[8deg] transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950 group cursor-pointer">
                  <img
                    src="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SFA/SFA_038_R_EN_SM.png"
                    alt="Fezandipiti ex"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>
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
      />
    </div>
  );
}
