'use client';

import React from 'react';
import { Search, SlidersHorizontal, X, ArrowUpDown, Palette, Sparkles, Box, Globe } from 'lucide-react';
import { FlagUS, FlagES } from './FlagIcon';

interface FiltersBarProps {
  search: string;
  setSearch: (val: string) => void;
  selectedExpansion: string;
  setSelectedExpansion: (val: string) => void;
  selectedArtist: string;
  setSelectedArtist: (val: string) => void;
  selectedVersion: string;
  setSelectedVersion: (val: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  expansions: string[];
  artists: string[];
  versions: string[];
  languages?: string[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

export default function FiltersBar({
  search,
  setSearch,
  selectedExpansion,
  setSelectedExpansion,
  selectedArtist,
  setSelectedArtist,
  selectedVersion,
  setSelectedVersion,
  selectedLanguage,
  setSelectedLanguage,
  sort,
  setSort,
  inStockOnly,
  setInStockOnly,
  expansions,
  artists,
  versions,
  languages = ['Inglés', 'Español'],
  onReset,
  hasActiveFilters,
}: FiltersBarProps) {
  return (
    <div className="w-full bg-[#0d1527]/90 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Row: Search and Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nombre + Expansión o Número... Ej: Charmander 151, Charizard 199, Pikachu"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[190px]">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              <option value="newest">Más recientes</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name_asc">Nombre: A - Z</option>
              <option value="stock_desc">Mayor Stock</option>
            </select>
          </div>

          {/* In Stock toggle */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
              inStockOnly
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/10'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>En stock</span>
          </button>
        </div>
      </div>

      {/* Second Row: Specific Filters (Expansión, Idioma, Artista, Versión) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-800/60">
        {/* Expansión Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Expansión / Set (EN)</span>
          </label>
          <select
            value={selectedExpansion}
            onChange={(e) => setSelectedExpansion(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Todas las expansiones</option>
            {expansions.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
        </div>

        {/* Idioma Filter with Flag Buttons */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>Idioma de Carta</span>
          </label>
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 h-[38px]">
            <button
              type="button"
              onClick={() => setSelectedLanguage('')}
              className={`flex-1 h-full rounded-lg text-xs font-semibold transition-all ${
                !selectedLanguage
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('Inglés')}
              className={`flex-1 h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                selectedLanguage === 'Inglés'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Filtrar cartas en inglés"
            >
              <FlagUS className="w-4 h-3 rounded-[1px] shadow-sm flex-shrink-0" />
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('Español')}
              className={`flex-1 h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                selectedLanguage === 'Español'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Filtrar cartas en español"
            >
              <FlagES className="w-4 h-3 rounded-[1px] shadow-sm flex-shrink-0" />
              <span>ES</span>
            </button>
          </div>
        </div>

        {/* Artista Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-blue-400" />
            <span>Artista / Ilustrador</span>
          </label>
          <select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Todos los artistas</option>
            {artists.map((art) => (
              <option key={art} value={art}>
                {art}
              </option>
            ))}
          </select>
        </div>

        {/* Versión Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-purple-400" />
            <span>Versión de Carta</span>
          </label>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Todas las versiones</option>
            {versions.map((ver) => (
              <option key={ver} value={ver}>
                {ver}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters bar and reset button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Filtros aplicados</span>
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar todos los filtros</span>
          </button>
        </div>
      )}
    </div>
  );
}
