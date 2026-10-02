'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  PlusCircle,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  RefreshCw,
  Globe,
  User,
  Phone,
  Package,
  X,
} from 'lucide-react';
import { FlagUS, FlagES, LanguageBadge } from '@/components/FlagIcon';

const OFFICIAL_RARITIES = [
  'Common',
  'Reverse',
  'Holo',
  'Cosmos Holo',
  'EX',
  'Full Art',
  'IR/SIR',
  'Otro (Custom)',
] as const;

// Search Result Item with robust image fallback
function SearchCardItem({
  item,
  isSelected,
  onSelect,
}: {
  item: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(item.image || '/placeholder-card.svg');

  useEffect(() => {
    setImgSrc(item.image || '/placeholder-card.svg');
  }, [item.image]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center p-2.5 rounded-xl border transition-all text-left ${
        isSelected
          ? 'bg-blue-950 border-blue-500 shadow-md ring-2 ring-blue-500/50'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
      }`}
    >
      <div className="relative w-full aspect-[2.5/3.5] mb-2 flex items-center justify-center overflow-hidden rounded bg-slate-950/70 p-1">
        <img
          src={imgSrc}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          onError={() => {
            if (imgSrc !== '/placeholder-card.svg') {
              setImgSrc('/placeholder-card.svg');
            }
          }}
        />
      </div>
      <p className="text-[11px] font-bold text-white truncate w-full text-center">
        {item.name}
      </p>
      <div className="flex items-center justify-center gap-1 w-full text-center mt-0.5 flex-wrap">
        <span className="text-[10px] text-blue-400 font-semibold">
          #{item.localId}
        </span>
        {item.setName && (
          <span className="text-[9px] text-slate-400 truncate max-w-[85px]">
            · {item.setName}
          </span>
        )}
      </div>
    </button>
  );
}

export default function NewCardPage() {
  const router = useRouter();

  // Mode: 'assisted' (TCGdex) or 'manual'
  const [mode, setMode] = useState<'assisted' | 'manual'>('assisted');

  // Search assisted state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLang, setSearchLang] = useState<'en' | 'es'>('en');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTcgdexCard, setSelectedTcgdexCard] = useState<any>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  // Card Form State
  const [name, setName] = useState('');
  const [expansion, setExpansion] = useState('');
  const [number, setNumber] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('Common');
  const [customRarityText, setCustomRarityText] = useState('');
  const [isFoil, setIsFoil] = useState(false);
  const [isLeague, setIsLeague] = useState(false);
  const [language, setLanguage] = useState<'Inglés' | 'Español'>('Inglés');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState('Pokemon');
  const [trainerType, setTrainerType] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [stock, setStock] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('Near Mint');

  const handleRarityChange = (newRarity: string) => {
    setSelectedRarity(newRarity);
    if (newRarity === 'Common') {
      setIsFoil(false);
    } else if (newRarity === 'Otro (Custom)') {
      // User can toggle isFoil manually
    } else {
      // Reverse, Holo, Cosmos Holo, EX, Full Art, IR/SIR are FOIL automatically
      setIsFoil(true);
    }
  };

  // Seller State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorizedSellers, setAuthorizedSellers] = useState<any[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [selectedSellerName, setSelectedSellerName] = useState('');
  const [selectedSellerPhone, setSelectedSellerPhone] = useState('');

  // Fetch current user and authorized sellers on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          setSelectedSellerId(data.user.id);
          setSelectedSellerName(data.user.username);
          setSelectedSellerPhone(data.user.phone || '');

          if (data.user.username.toLowerCase() === 'luca') {
            fetch('/api/users')
              .then((r) => (r.ok ? r.json() : null))
              .then((uData) => {
                if (uData?.users) {
                  const active = uData.users.filter((u: any) => u.is_active === 1);
                  setAuthorizedSellers(active);
                  const selfUser = uData.users.find((u: any) => u.id === data.user.id);
                  if (selfUser?.phone) {
                    setSelectedSellerPhone(selfUser.phone);
                  }
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSellerChange = (userId: number) => {
    const found = authorizedSellers.find((s) => s.id === userId);
    if (found) {
      setSelectedSellerId(found.id);
      setSelectedSellerName(found.username);
      setSelectedSellerPhone(found.phone || '');
    }
  };

  // Status
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Duplicate detection & resolution modal
  const [duplicateModalData, setDuplicateModalData] = useState<{
    existing_card: any;
    stock_to_add: number;
    entered_price: number;
    message?: string;
  } | null>(null);
  const [resolvingDuplicate, setResolvingDuplicate] = useState(false);
  const [liveExisting, setLiveExisting] = useState<any | null>(null);

  // Live duplicate check on form field changes
  useEffect(() => {
    if (!name.trim() || !expansion.trim() || !number.trim()) {
      setLiveExisting(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const finalVersion = selectedRarity === 'Otro (Custom)'
          ? (customRarityText.trim() || 'Custom')
          : selectedRarity;
        const params = new URLSearchParams({
          checkDuplicate: 'true',
          name: name.trim(),
          expansion: expansion.trim(),
          number: number.trim(),
          version: finalVersion,
          language: language.trim(),
          is_foil: isFoil ? '1' : '0',
          is_league: isLeague ? '1' : '0',
          seller_id: selectedSellerId ? String(selectedSellerId) : '',
        });
        const res = await fetch(`/api/cards?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLiveExisting(data.existing || null);
        }
      } catch {
        // silent fail
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [name, expansion, number, selectedRarity, customRarityText, language, isFoil, isLeague, selectedSellerId]);

  // Handle Search TCGdex
  const handleSearchTcgdex = async (query: string, lang = searchLang) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/tcgdex/search?q=${encodeURIComponent(query.trim())}&lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === 'assisted') {
        handleSearchTcgdex(searchQuery, searchLang);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, searchLang, mode]);

  // When admin picks a card from search results:
  const handleSelectCard = async (tcgCard: any) => {
    setSelectedTcgdexCard(tcgCard);
    setFetchingDetail(true);
    try {
      const res = await fetch(`/api/tcgdex/card/${encodeURIComponent(tcgCard.id)}?lang=${searchLang}`);
      if (res.ok) {
        const detail = await res.json();
        setName(detail.name || tcgCard.name);
        // Expansion is guaranteed to be in English by our API endpoint
        setExpansion(detail.expansion || '');
        setNumber(detail.number || tcgCard.localId || '');
        setArtist(detail.artist || 'Oficial');
        setImageUrl(detail.image || tcgCard.image || '');
        const rawRarity = (detail.rarity || '').toLowerCase();
        const rawName = (detail.name || tcgCard.name || '').toLowerCase();
        if (rawRarity.includes('illustration') || rawRarity.includes('special illustration')) {
          handleRarityChange('IR/SIR');
        } else if (rawRarity.includes('full art') || rawRarity.includes('ultra rare') || rawRarity.includes('secret') || rawRarity.includes('hyper')) {
          handleRarityChange('Full Art');
        } else if (rawName.endsWith(' ex') || rawRarity.includes('ex')) {
          handleRarityChange('EX');
        } else if (rawRarity.includes('holo')) {
          handleRarityChange('Holo');
        } else if (rawRarity.includes('reverse')) {
          handleRarityChange('Reverse');
        } else if (rawRarity.includes('common') || rawRarity.includes('uncommon')) {
          handleRarityChange('Common');
        } else {
          handleRarityChange('Common');
        }
        setLanguage(searchLang === 'es' ? 'Español' : 'Inglés');
        setCategory(detail.category || 'Pokemon');
        setTrainerType(detail.trainerType || '');
      } else {
        // Fallback with basic info
        setName(tcgCard.name);
        setNumber(tcgCard.localId || '');
        setImageUrl(tcgCard.image || '');
        setLanguage(searchLang === 'es' ? 'Español' : 'Inglés');
        setCategory('Pokemon');
        setTrainerType('');
      }
    } catch (e) {
      console.error(e);
      setName(tcgCard.name);
      setNumber(tcgCard.localId || '');
      setImageUrl(tcgCard.image || '');
      setCategory('Pokemon');
      setTrainerType('');
    } finally {
      setFetchingDetail(false);
    }
  };

  const resetForm = () => {
    setName('');
    setExpansion('');
    setNumber('');
    setArtist('');
    setPrice('');
    setStock(1);
    setImageUrl('');
    setSelectedRarity('Common');
    setCustomRarityText('');
    setIsFoil(false);
    setIsLeague(false);
    setCategory('Pokemon');
    setTrainerType('');
    setSelectedTcgdexCard(null);
    setLiveExisting(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !expansion || !number) {
      setErrorMsg('Por favor completa los campos obligatorios: Nombre, Colección y Número.');
      return;
    }

    if (!price || Number(price) <= 0) {
      setErrorMsg('Por favor ingresa un precio válido mayor a 0.');
      return;
    }

    setLoading(true);

    const finalVersion = selectedRarity === 'Otro (Custom)'
      ? (customRarityText.trim() || 'Custom')
      : selectedRarity;

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          expansion,
          number,
          version: finalVersion,
          language,
          artist: artist || 'Desconocido',
          price: Number(price),
          stock: Number(stock),
          image_url: imageUrl || '/placeholder-card.png',
          rarity: finalVersion,
          notes,
          category,
          trainer_type: trainerType,
          seller_id: selectedSellerId,
          seller_name: selectedSellerName,
          seller_phone: selectedSellerPhone,
          is_foil: isFoil ? 1 : 0,
          is_league: isLeague ? 1 : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Error al guardar la carta');
        setLoading(false);
        return;
      }

      // Check if duplicate detected and prompt user
      if (data.duplicate_detected) {
        setDuplicateModalData(data);
        setLoading(false);
        return;
      }

      setSuccessMsg(data.message || `¡"${name}" (${language}) agregada con éxito al catálogo con ${stock} unidad(es)!`);
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setErrorMsg('Error de conexión al guardar.');
    } finally {
      setLoading(false);
    }
  };

  // Resolve duplicate modal decision
  const handleDuplicateDecision = async (action: 'merge_keep_price' | 'merge_update_price' | 'create_new') => {
    if (!duplicateModalData) return;
    setResolvingDuplicate(true);
    setErrorMsg('');

    const finalVersion = selectedRarity === 'Otro (Custom)'
      ? (customRarityText.trim() || 'Custom')
      : selectedRarity;

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          expansion,
          number,
          version: finalVersion,
          language,
          artist: artist || 'Desconocido',
          price: Number(price),
          stock: Number(stock),
          image_url: imageUrl || '/placeholder-card.png',
          rarity: finalVersion,
          notes,
          category,
          trainer_type: trainerType,
          seller_id: selectedSellerId,
          seller_name: selectedSellerName,
          seller_phone: selectedSellerPhone,
          is_foil: isFoil ? 1 : 0,
          is_league: isLeague ? 1 : 0,
          action,
          target_card_id: duplicateModalData.existing_card?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Error al procesar la publicación');
        setResolvingDuplicate(false);
        return;
      }

      setDuplicateModalData(null);
      setSuccessMsg(data.message || `Operación completada con éxito para "${name}".`);
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setErrorMsg('Error de conexión al procesar la publicación.');
    } finally {
      setResolvingDuplicate(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </Link>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setMode('assisted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              mode === 'assisted'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Búsqueda Asistida (Rápida)
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✏️ Carga Manual
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <PlusCircle className="w-7 h-7 text-blue-400" />
          <span>Cargar Stock de Cartas</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {mode === 'assisted'
            ? 'Busca el Pokémon para autocompletar foto HD, set en inglés y artista en 1 clic.'
            : 'Ingresa manualmente los datos de la carta e imagen para registrar en stock.'}
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs sm:text-sm">
          <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ASSISTED SEARCH SECTION */}
      {mode === 'assisted' && (
        <div className="bg-[#0d1629] border border-blue-900/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>1. Buscar Carta en Base de Datos Oficial</span>
            </h2>

            {/* Language toggle for search */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Buscar en:</span>
              <button
                type="button"
                onClick={() => setSearchLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  searchLang === 'en'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FlagUS className="w-4 h-3 rounded-[1px] shadow-sm flex-shrink-0" />
                <span>English</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchLang('es')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  searchLang === 'es'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FlagES className="w-4 h-3 rounded-[1px] shadow-sm flex-shrink-0" />
                <span>Español</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe Nombre + Expansión o Número... Ej: Charmander 151, Charmander Dragon, Charizard 199"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Search results picker */}
          {searchResults.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Haz clic en la carta correspondiente para autocompletar:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto p-2 bg-slate-950/80 rounded-2xl border border-slate-800">
                {searchResults.map((item) => (
                  <SearchCardItem
                    key={item.id}
                    item={item}
                    isSelected={selectedTcgdexCard?.id === item.id}
                    onSelect={() => handleSelectCard(item)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAIN CARD ENTRY FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Form fields */}
          <div className="lg:col-span-2 bg-[#0d1629] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>2. Datos de la Carta y Stock</span>
              {fetchingDetail && (
                <span className="text-xs font-normal text-blue-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando detalles oficiales...
                </span>
              )}
            </h2>

            {/* Vendedor Asignado Banner / Selector */}
            <div className="p-4 rounded-2xl bg-[#090f1d] border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Vendedor Asignado a esta Carta</span>
                </span>
                <p className="text-xs text-slate-400">
                  Los pedidos por WhatsApp de los clientes llegarán directamente a este vendedor.
                </p>
              </div>

              {currentUser?.username?.toLowerCase() === 'luca' && authorizedSellers.length > 0 ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSellerId || ''}
                    onChange={(e) => handleSellerChange(Number(e.target.value))}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-blue-500/60 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow"
                  >
                    {authorizedSellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        Vendedor: {seller.username} {seller.phone ? `(+${seller.phone})` : '(Sin WhatsApp)'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-950/80 border border-blue-600/50 text-xs font-bold text-white">
                  <span>👤 {selectedSellerName || currentUser?.username || 'Cargando...'}</span>
                  {selectedSellerPhone ? (
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <Phone className="w-3 h-3" /> +{selectedSellerPhone}
                    </span>
                  ) : (
                    <span className="text-amber-400 text-[11px]">(Sin WhatsApp configurado)</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Nombre de la Carta *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Charizard ex"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Colección / Set (En Inglés) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Colección / Expansión (en inglés) *
                </label>
                <input
                  type="text"
                  required
                  value={expansion}
                  onChange={(e) => setExpansion(e.target.value)}
                  placeholder="Ej: 151, Paldean Fates, Stellar Crown, Surging Sparks"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Número */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Número de Carta *
                </label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ej: 199/165"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Idioma de la Carta */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Idioma de la Carta *</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Inglés">🇺🇸 Inglés (EN)</option>
                  <option value="Español">🇪🇸 Español (ES)</option>
                </select>
              </div>

              {/* Rareza / Versión Estandarizada */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Rareza / Versión *
                </label>
                <select
                  value={selectedRarity}
                  onChange={(e) => handleRarityChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {OFFICIAL_RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Casillero FOIL con iconito de brillito ✨ */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Efecto Holográfico
                </label>
                <div
                  onClick={() => {
                    if (selectedRarity === 'Otro (Custom)') {
                      setIsFoil(!isFoil);
                    }
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                    selectedRarity === 'Otro (Custom)'
                      ? 'cursor-pointer hover:border-slate-600'
                      : 'cursor-default'
                  } ${
                    isFoil
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-sm shadow-amber-950/30'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                  title={
                    selectedRarity === 'Otro (Custom)'
                      ? 'Toca para marcar o desmarcar el efecto FOIL'
                      : 'Auto-marcado según la rareza seleccionada'
                  }
                >
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={`w-4 h-4 transition-colors ${
                        isFoil ? 'text-amber-400 animate-pulse' : 'text-slate-600'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isFoil ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    >
                      {isFoil ? 'Carta FOIL / Con Brillo ✨' : 'Sin Brillo (NO FOIL)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {selectedRarity !== 'Otro (Custom)' && (
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        Auto
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={isFoil}
                      disabled={selectedRarity !== 'Otro (Custom)'}
                      onChange={(e) => setIsFoil(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox Opcional Carta de Liga (Prize Pack) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Edición de Liga / Prize Pack (Play! Pokémon)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </label>
                <div
                  onClick={() => setIsLeague(!isLeague)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isLeague
                      ? 'bg-red-950/40 border-red-500/70 shadow-md shadow-red-950/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                  title="Marcar si esta carta incluye el logo/sello oficial de Liga (Prize Pack)"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 flex-shrink-0">
                      <img
                        src="/prize-pack-stamp.png"
                        alt="Play! Pokémon Prize Pack"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${isLeague ? 'text-red-300' : 'text-slate-300'}`}>
                        {isLeague ? 'Carta Oficial de Liga (Prize Pack)' : 'Carta Regular (Sin Sello de Liga)'}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {isLeague
                          ? 'Se mostrará el sello oficial de Liga en la carta en el catálogo y tienda.'
                          : 'Marca esta casilla si la carta proviene de un sobre oficial de Liga (Prize Pack).'}
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isLeague}
                    onChange={(e) => setIsLeague(e.target.checked)}
                    className="w-5 h-5 rounded text-red-600 bg-slate-800 border-slate-700 cursor-pointer accent-red-600 ml-2"
                  />
                </div>
              </div>

              {/* Si seleccionó Otro (Custom), campo de texto para escribir la rareza */}
              {selectedRarity === 'Otro (Custom)' && (
                <div className="sm:col-span-2 space-y-1.5 p-3.5 rounded-2xl bg-[#090f1e] border border-amber-500/40 animate-in fade-in">
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Escribe la rareza personalizada que no figure *
                  </label>
                  <input
                    type="text"
                    required
                    value={customRarityText}
                    onChange={(e) => setCustomRarityText(e.target.value)}
                    placeholder="Ej: Promo Stamp, Amazing Rare, Ace Spec, Vintage 1st Edition..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Al usar una rareza Custom, puedes marcar o desmarcar libremente el casillero de FOIL de arriba.
                  </p>
                </div>
              )}

              {/* Precio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Precio ($ ARS) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ej: 135000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-bold placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Cantidad en Stock */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Cantidad en Stock *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStock((s) => Math.max(0, s - 1))}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 text-center rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setStock((s) => s + 1)}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Artista */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Artista / Ilustrador
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ej: AKIRA EGAWA, Ken Sugimori"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* URL de Imagen */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                URL de Imagen HD
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://assets.tcgdex.net/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Notas / Estado */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Estado / Notas adicionales
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Near Mint, Pack Fresh, Centrado perfecto"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Column 3: Live Preview Box */}
          <div className="bg-[#0d1629] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Vista Previa en Tienda</span>
              </h3>

              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex flex-col items-center text-center space-y-3">
                <div className="relative w-44 aspect-[2.5/3.5] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg">
                  {imageUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={imageUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-card.svg';
                        }}
                      />
                      {isLeague && (
                        <div
                          className="absolute bottom-2 right-2 p-1 rounded-md bg-black/80 border border-red-500/60 shadow-lg flex items-center"
                          title="Sello Oficial de Liga (Prize Pack)"
                        >
                          <img
                            src="/prize-pack-stamp.png"
                            alt="Play! Pokémon League"
                            className="w-5 h-4 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-xs text-slate-500">
                      Selecciona una carta o pega una URL de imagen
                    </div>
                  )}
                </div>

                <div className="w-full text-left space-y-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                        {selectedRarity === 'Otro (Custom)' ? (customRarityText.trim() || 'Custom') : selectedRarity}
                      </span>
                      {isFoil && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                          ✨ FOIL
                        </span>
                      )}
                      {isLeague && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-950/80 text-red-200 border border-red-700/60 flex items-center gap-1 shadow-sm">
                          <img
                            src="/prize-pack-stamp.png"
                            alt="Prize Pack"
                            className="w-3.5 h-3 object-contain"
                          />
                          <span>Liga</span>
                        </span>
                      )}
                      <LanguageBadge language={language} size="xs" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {stock} en stock
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white truncate">
                    {name || 'Nombre de la carta'}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {expansion || 'Expansión (EN)'} · #{number || '000/000'}
                  </p>
                  <p className="text-sm font-black text-white pt-1">
                    {price ? `$ ${Number(price).toLocaleString('es-AR')}` : '$ 0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Existing Duplicate Notice */}
            {liveExisting && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    Ya tienes publicado este artículo con <strong>{liveExisting.stock} u.</strong> a <strong>${Number(liveExisting.price).toLocaleString('es-AR')}</strong>. Al guardar podrás sumar stock o crear otra publicación.
                  </span>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 shadow-xl shadow-blue-900/40 border border-blue-500/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando carta...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 text-blue-300" />
                  <span>Cargar y Publicar Carta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Duplicate Card Detected Resolution Modal */}
      {duplicateModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl bg-[#0a0f1d] border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-950/50 p-6 sm:p-7 space-y-6 text-slate-200 max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-inner">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Artículo ya publicado en tu catálogo
                  </h3>
                  <p className="text-xs text-amber-300/90 font-medium">
                    Ya tienes <strong className="text-white">{duplicateModalData.existing_card.stock} unidad(es)</strong> de este artículo a <strong className="text-white">${duplicateModalData.existing_card.price.toLocaleString('es-AR')}</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateModalData(null)}
                disabled={resolvingDuplicate}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison preview banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-16 h-22 rounded-xl bg-slate-950/80 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-800">
                <img
                  src={duplicateModalData.existing_card.image_url || imageUrl || '/placeholder-card.svg'}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h4 className="font-bold text-sm text-white truncate">
                  {name}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {expansion} · #{number} · {selectedRarity} · {language}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-950/80 rounded-lg px-2.5 py-1.5 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Stock actual:</span>
                    <span className="font-bold text-slate-200">{duplicateModalData.existing_card.stock} u.</span>
                    <span className="text-[10px] text-emerald-400 font-bold ml-1">+{stock} u. nueva(s)</span>
                  </div>
                  <div className="bg-slate-950/80 rounded-lg px-2.5 py-1.5 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Precio publicado:</span>
                    <span className="font-bold text-slate-200">${duplicateModalData.existing_card.price.toLocaleString('es-AR')}</span>
                    {duplicateModalData.existing_card.price !== Number(price) && (
                      <span className="text-[10px] text-amber-300 font-bold block">
                        Ingresado: ${Number(price).toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt explanation */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                ¿Deseas sumar al stock al precio publicado (${duplicateModalData.existing_card.price.toLocaleString('es-AR')}) o elegir otra opción?
              </p>

              {/* Opción 1: Sumar al stock y mantener el precio */}
              <button
                type="button"
                disabled={resolvingDuplicate}
                onClick={() => handleDuplicateDecision('merge_keep_price')}
                className="w-full text-left p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/25 hover:bg-emerald-900/40 hover:border-emerald-400 transition-all group flex items-start gap-3.5 cursor-pointer shadow-lg shadow-emerald-950/30"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <Check className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-emerald-200 group-hover:text-emerald-100">
                      Sumar al stock y mantener el precio
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                      ${duplicateModalData.existing_card.price.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Suma <strong className="text-white">+{stock} u.</strong> a la publicación existente. Tendrás un total de <strong className="text-white">{duplicateModalData.existing_card.stock + Number(stock)} unidades</strong> al precio publicado de <strong className="text-white">${duplicateModalData.existing_card.price.toLocaleString('es-AR')}</strong>.
                  </p>
                </div>
              </button>

              {/* Opción 2: Sumar al stock y actualizar precio */}
              <button
                type="button"
                disabled={resolvingDuplicate}
                onClick={() => handleDuplicateDecision('merge_update_price')}
                className="w-full text-left p-4 rounded-2xl border border-amber-500/40 bg-amber-950/25 hover:bg-amber-900/40 hover:border-amber-400 transition-all group flex items-start gap-3.5 cursor-pointer shadow-lg shadow-amber-950/30"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-amber-200 group-hover:text-amber-100">
                      Sumar al stock y actualizar precio
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30">
                      ${Number(price).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Suma <strong className="text-white">+{stock} u.</strong> y actualiza <strong className="text-white">todas las {duplicateModalData.existing_card.stock + Number(stock)} unidades</strong> al nuevo precio ingresado de <strong className="text-white">${Number(price).toLocaleString('es-AR')}</strong>.
                  </p>
                </div>
              </button>

              {/* Opción 3: Crear una nueva publicación */}
              <button
                type="button"
                disabled={resolvingDuplicate}
                onClick={() => handleDuplicateDecision('create_new')}
                className="w-full text-left p-4 rounded-2xl border border-blue-500/40 bg-blue-950/25 hover:bg-blue-900/40 hover:border-blue-400 transition-all group flex items-start gap-3.5 cursor-pointer shadow-lg shadow-blue-950/30"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-blue-200 group-hover:text-blue-100">
                      Crear una nueva publicación (Es otra carta u otra versión)
                    </span>
                    <span className="text-xs font-semibold text-blue-300 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/30">
                      Independiente
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Crea una publicación separada en el catálogo con <strong className="text-white">{stock} u. a ${Number(price).toLocaleString('es-AR')}</strong> (ej: para otra condición, versión o lote).
                  </p>
                </div>
              </button>
            </div>

            {/* Actions footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-[11px] text-slate-500">
                {resolvingDuplicate ? 'Procesando actualización...' : 'Selecciona una de las 3 opciones para continuar'}
              </span>
              <button
                type="button"
                disabled={resolvingDuplicate}
                onClick={() => setDuplicateModalData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
