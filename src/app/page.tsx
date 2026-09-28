'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import FiltersBar from '@/components/FiltersBar';
import CardItem, { CardData } from '@/components/CardItem';
import CartDrawer from '@/components/CartDrawer';
import CardDetailModal from '@/components/CardDetailModal';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Modal State
  const [activeCardModal, setActiveCardModal] = useState<CardData | null>(null);

  // Fetch filter metadata (expansions, artists, versions)
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
      if (selectedArtist) params.append('artist', selectedArtist);
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
  }, [search, selectedExpansion, selectedArtist, selectedVersion, selectedLanguage, sort, inStockOnly]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedExpansion('');
    setSelectedArtist('');
    setSelectedVersion('');
    setSelectedLanguage('');
    setSort('newest');
    setInStockOnly(false);
  };

  const hasActiveFilters = Boolean(
    search || selectedExpansion || selectedArtist || selectedVersion || selectedLanguage || inStockOnly || sort !== 'newest'
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

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Inventario y Stock en Tiempo Real</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                EL ALTO MANDO <span className="text-blue-400">TCG</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
                Catálogo especializado de cartas Pokémon singles, versiones Holo, Reverse, Full Art y Secret Rares. Stock oficial actualizado al instante.
              </p>
            </div>

            {/* Logo Showcase with Natural Aspect Ratio and Clean Glow */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center p-3 rounded-3xl bg-slate-900/50 border border-white/[0.08] shadow-2xl brand-glow">
                <Image
                  src="/logo.png"
                  alt="El Alto Mando TCG"
                  width={180}
                  height={180}
                  className="object-contain filter drop-shadow-[0_8px_25px_rgba(0,0,0,0.7)]"
                  priority
                />
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
          selectedArtist={selectedArtist}
          setSelectedArtist={setSelectedArtist}
          selectedVersion={selectedVersion}
          setSelectedVersion={setSelectedVersion}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          sort={sort}
          setSort={setSort}
          inStockOnly={inStockOnly}
          setInStockOnly={setInStockOnly}
          expansions={metadata.expansions}
          artists={metadata.artists}
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
