'use client';

import { Search, SlidersHorizontal, X, ArrowUpDown, Sparkles, Box, Globe } from 'lucide-react';
import { FlagUS, FlagES } from './FlagIcon';

interface FiltersBarProps {
  search: string;
  setSearch: (val: string) => void;
  selectedExpansion: string;
  setSelectedExpansion: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedTrainerType: string;
  setSelectedTrainerType: (val: string) => void;
  selectedVersion: string;
  setSelectedVersion: (val: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  expansions: string[];
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
  selectedCategory,
  setSelectedCategory,
  selectedTrainerType,
  setSelectedTrainerType,
  selectedVersion,
  setSelectedVersion,
  selectedLanguage,
  setSelectedLanguage,
  sort,
  setSort,
  inStockOnly,
  setInStockOnly,
  expansions,
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

      {/* Category Pills Row: Todas | Pokémon | Entrenador | Energía */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Categoría:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              setSelectedTrainerType('');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !selectedCategory
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Pokemon');
              setSelectedTrainerType('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'Pokemon'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>⚡ Pokémon</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Trainer');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'Trainer'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🎒 Entrenador (Trainer)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Energy');
              setSelectedTrainerType('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'Energy'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🔮 Energía (Energy)</span>
          </button>
        </div>

        {/* Subtype pills when Entrenador is selected: Supporter, Item, Tool, Stadium */}
        {selectedCategory === 'Trainer' && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-purple-950/40 border border-purple-800/40 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mr-1">
              Subtipo Entrenador:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTrainerType('')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                !selectedTrainerType
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedTrainerType('Supporter')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedTrainerType === 'Supporter'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              👤 Partidario (Supporter)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTrainerType('Item')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedTrainerType === 'Item'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              📦 Objeto (Item)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTrainerType('Tool')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedTrainerType === 'Tool'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              🛡️ Herramienta (Tool)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTrainerType('Stadium')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedTrainerType === 'Stadium'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              🏟️ Estadio (Stadium)
            </button>
          </div>
        )}
      </div>

      {/* Second Row: Specific Filters (Expansión, Tipo / Categoría, Idioma, Versión) */}
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

        {/* Tipo / Categoría Dropdown Filter (replaces Artista) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-blue-400" />
            <span>Tipo / Categoría</span>
          </label>
          <select
            value={
              selectedCategory === 'Trainer'
                ? selectedTrainerType ? `Trainer:${selectedTrainerType}` : 'Trainer'
                : selectedCategory
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val.startsWith('Trainer:')) {
                setSelectedCategory('Trainer');
                setSelectedTrainerType(val.replace('Trainer:', ''));
              } else if (val === 'Trainer') {
                setSelectedCategory('Trainer');
                setSelectedTrainerType('');
              } else {
                setSelectedCategory(val);
                setSelectedTrainerType('');
              }
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            <option value="Pokemon">⚡ Pokémon</option>
            <option value="Trainer">🎒 Entrenador (Todos)</option>
            <option value="Trainer:Supporter">&nbsp;&nbsp;&nbsp;&nbsp;👤 Partidario (Supporter)</option>
            <option value="Trainer:Item">&nbsp;&nbsp;&nbsp;&nbsp;📦 Objeto (Item)</option>
            <option value="Trainer:Tool">&nbsp;&nbsp;&nbsp;&nbsp;🛡️ Herramienta (Tool)</option>
            <option value="Trainer:Stadium">&nbsp;&nbsp;&nbsp;&nbsp;🏟️ Estadio (Stadium)</option>
            <option value="Energy">🔮 Energía (Energy)</option>
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
