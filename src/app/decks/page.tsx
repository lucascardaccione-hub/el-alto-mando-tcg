'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Layers,
  Plus,
  FileText,
  Sparkles,
  ArrowRight,
  Trash2,
  Share2,
  Clock,
  User,
  ShoppingBag,
  ExternalLink,
  Globe,
  Lock,
  Users,
  Eye,
  BookOpen,
  Flame,
  TrendingUp,
  Search,
  Award,
  BarChart3,
  Filter,
} from 'lucide-react';
import { parsePtcglDeck, getGenericEnergyImage } from '@/lib/deckParser';

export default function DecksPage() {
  const router = useRouter();
  const [myDecks, setMyDecks] = useState<any[]>([]);
  const [communityDecks, setCommunityDecks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'community' | 'frequent'>('my');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importName, setImportName] = useState('');
  const [importError, setImportError] = useState('');
  const [savingImport, setSavingImport] = useState(false);

  // Top frequent cards state
  const [frequentCards, setFrequentCards] = useState<any[]>([]);
  const [totalDecksAnalyzed, setTotalDecksAnalyzed] = useState(0);
  const [frequentLoading, setFrequentLoading] = useState(false);
  const [frequentCategory, setFrequentCategory] = useState<'all' | 'pokemon' | 'trainer' | 'energy'>('all');
  const [frequentSearch, setFrequentSearch] = useState('');

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const [resMy, resPub] = await Promise.all([
        fetch('/api/decks?filter=my'),
        fetch('/api/decks?filter=public'),
      ]);
      if (resMy.ok) {
        const dataMy = await resMy.json();
        setMyDecks(dataMy.decks || []);
      }
      if (resPub.ok) {
        const dataPub = await resPub.json();
        setCommunityDecks(dataPub.decks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFrequentCards = async () => {
    setFrequentLoading(true);
    try {
      const res = await fetch('/api/decks/top-cards');
      if (res.ok) {
        const data = await res.json();
        setFrequentCards(data.cards || []);
        setTotalDecksAnalyzed(data.totalDecks || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFrequentLoading(false);
    }
  };

  const filteredFrequentCards = frequentCards.filter((card) => {
    if (frequentCategory !== 'all' && card.category !== frequentCategory) return false;
    if (frequentSearch.trim()) {
      const q = frequentSearch.toLowerCase().trim();
      const matchName = card.card_name?.toLowerCase().includes(q);
      const matchSet = card.expansion?.toLowerCase().includes(q);
      if (!matchName && !matchSet) return false;
    }
    return true;
  });

  const handleToggleDeckVisibility = async (deckId: number, currentPublic: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPublic = currentPublic === 1 ? 0 : 1;
    setTogglingId(deckId);
    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: nextPublic }),
      });
      if (res.ok) {
        setMyDecks((prev) =>
          prev.map((d) => (d.id === deckId ? { ...d, is_public: nextPublic } : d))
        );
        // Refresh community list
        const resPub = await fetch('/api/decks?filter=public');
        if (resPub.ok) {
          const dataPub = await resPub.json();
          setCommunityDecks(dataPub.decks || []);
        }
      }
    } catch (err) {
      console.error('Error toggling deck visibility:', err);
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    fetchDecks();
    fetchFrequentCards();
  }, []);

  const handleCreateNew = () => {
    router.push('/deck-builder');
  };

  const handleProcessImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');

    if (!importText.trim()) {
      setImportError('Por favor pega el texto del mazo en formato PTCGL / Limitless.');
      return;
    }

    const parsed = parsePtcglDeck(importText);
    if (parsed.cards.length === 0) {
      setImportError('No se reconocieron cartas válidas. Asegúrate de copiar el formato estándar de Limitless o PTCGL.');
      return;
    }

    setSavingImport(true);
    try {
      const resolveRes = await fetch('/api/tcgdex/resolve-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: parsed.cards }),
      });
      const resolvedData = await resolveRes.json();
      const finalCards = resolvedData?.cards || parsed.cards;

      sessionStorage.setItem('importedDeck', JSON.stringify({
        name: importName.trim() || 'Nuevo Mazo Importado',
        format: 'Standard',
        description: 'Mazo importado desde Limitless / Pokémon TCG Live',
        cards: finalCards,
      }));

      router.push('/deck-builder?import=1');
    } catch {
      sessionStorage.setItem('importedDeck', JSON.stringify({
        name: importName.trim() || 'Nuevo Mazo Importado',
        format: 'Standard',
        description: 'Mazo importado desde Limitless / Pokémon TCG Live',
        cards: parsed.cards,
      }));
      router.push('/deck-builder?import=1');
    } finally {
      setSavingImport(false);
    }
  };

  const handleDeleteDeck = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar este mazo?')) return;

    try {
      const res = await fetch(`/api/decks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMyDecks((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    document.title = 'Decks de la Comunidad — El Alto Mando TCG';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="relative rounded-3xl overflow-hidden bg-[#0a0f1d]/90 border border-white/[0.08] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-600/[0.08] blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Comunidad Competitiva Pokémon TCG</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Decks de la Comunidad — El Alto Mando TCG
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Explora los mejores mazos de 60 cartas en formato oficial de torneos y <strong className="text-white">Pokémon TCG Live</strong>. Revisa cartas en posesión, faltantes y disponibilidad en nuestra Tienda.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleCreateNew}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Mazo Desde Cero</span>
              </button>

              <button
                onClick={() => setImportModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:text-white transition-all"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Pegar Lista (Limitless / PTCGL)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Navigation Tabs: Mis Mazos | Decks de la Comunidad | Meta Limitless */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'my'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mis Mazos</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-extrabold">
              {myDecks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'community'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-300" />
            <span>Decks de la Comunidad</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-950 text-blue-200 border border-blue-700/50 font-extrabold">
              {communityDecks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('frequent')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'frequent'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-lg shadow-orange-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Cartas más Frecuentes (TOP 100)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-extrabold">
              TOP 100
            </span>
          </button>
        </div>

        {/* Tab 1: My Decks Section */}
        {activeTab === 'my' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>Mis Mazos Guardados</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mazos personales en tu cuenta. Puedes hacerlos públicos o mantenerlos privados.
              </p>
            </div>
            <span className="text-xs text-slate-400">{myDecks.length} mazos registrados</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">Cargando tus mazos...</div>
          ) : myDecks.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#0b1220]/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Layers className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="font-bold text-white text-base">Aún no tienes mazos guardados</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Crea tu primer mazo de 60 cartas o importa una lista desde Limitless TCG para probar la disponibilidad de stock.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Empezar Mazo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myDecks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => router.push(`/deck-builder/${deck.id}`)}
                  className="group relative bg-[#0b1220] hover:bg-[#0f172a] border border-slate-800/80 hover:border-blue-500/50 rounded-2xl p-5 transition-all shadow-xl cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-22 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={deck.cover_card_image || '/placeholder-card.svg'}
                        alt={deck.name}
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-card.svg'; }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/40">
                          {deck.format}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          {deck.total_cards || 60}/60 cartas
                        </span>

                        {/* Visibility Pill with 1-click toggle */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleDeckVisibility(deck.id, deck.is_public, e)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all border cursor-pointer ${
                            deck.is_public === 1
                              ? 'bg-blue-950/90 text-blue-300 border-blue-700 hover:bg-blue-900'
                              : 'bg-amber-950/90 text-amber-300 border-amber-600 hover:bg-amber-900'
                          }`}
                          title={
                            deck.is_public === 1
                              ? 'Público en Decks de la Comunidad (Haz clic para mantenerlo privado)'
                              : 'Privado en tu cuenta (Haz clic para hacerlo público)'
                          }
                        >
                          {deck.is_public === 1 ? (
                            <>
                              <Globe className="w-2.5 h-2.5 text-blue-300" />
                              <span>Público</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              <span>Privado</span>
                            </>
                          )}
                        </button>
                      </div>
                      <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                        {deck.name}
                      </h3>
                      {deck.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{deck.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(deck.updated_at).toLocaleDateString('es-AR')}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteDeck(deck.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Eliminar mazo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Abrir <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {/* Tab 2: Community Decks Section */}
        {activeTab === 'community' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-blue-400" />
                <span>Decks de la Comunidad</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mazos compartidos públicamente por la comunidad de entrenadores de El Alto Mando TCG.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{communityDecks.length} mazos públicos</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">Cargando mazos de la comunidad...</div>
          ) : communityDecks.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#0b1220]/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-blue-400">
                <Globe className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="font-bold text-white text-base">Aún no hay mazos públicos en la comunidad</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ¡Sé el primero en compartir! Al crear o editar tu mazo, marca la opción "1. Hacer público el deck".
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear y Compartir Mazo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {communityDecks.map((deck) => (
                <div
                  key={`community-deck-${deck.id}`}
                  onClick={() => router.push(`/deck-builder/${deck.id}`)}
                  className="group relative bg-[#0b1220] hover:bg-[#0f172a] border border-slate-800/80 hover:border-blue-500/50 rounded-2xl p-5 transition-all shadow-xl cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-22 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={deck.cover_card_image || '/placeholder-card.svg'}
                        alt={deck.name}
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-card.svg'; }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/40">
                          {deck.format}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          {deck.total_cards || 60}/60 cartas
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-900/40 text-blue-300 border border-blue-700/50">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Público</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                        {deck.name}
                      </h3>
                      {deck.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{deck.description}</p>
                      )}
                      <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-400">
                        <User className="w-3 h-3 text-blue-400" />
                        <span>Por: <strong className="text-slate-200 font-semibold">@{deck.author_name}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(deck.updated_at).toLocaleDateString('es-AR')}
                    </span>

                    <span className="font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-xs">
                      Ver Mazo <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {/* Tab 3: Cartas más Frecuentes (TOP 100) */}
        {activeTab === 'frequent' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-slate-900 border border-amber-500/30 shadow-xl">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Flame className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>TOP 100 Cartas Más Frecuentes</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Metagame Live
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Recopilación estadística en base a <strong className="text-white">{totalDecksAnalyzed} {totalDecksAnalyzed === 1 ? 'mazo registrado' : 'mazos registrados'}</strong> en la plataforma.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Mazos Analizados</span>
                  <span className="text-base font-black text-white">{totalDecksAnalyzed}</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Cartas Rankeadas</span>
                  <span className="text-base font-black text-amber-400">{filteredFrequentCards.length}</span>
                </div>
              </div>
            </div>

            {/* Filter Controls: Category & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Todas las Categorías' },
                  { id: 'pokemon', label: 'Pokémon' },
                  { id: 'trainer', label: 'Entrenadores' },
                  { id: 'energy', label: 'Energías' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFrequentCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      frequentCategory === cat.id
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar carta en el TOP 100..."
                  value={frequentSearch}
                  onChange={(e) => setFrequentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Cards Grid */}
            {frequentLoading ? (
              <div className="text-center py-20 space-y-3">
                <BarChart3 className="w-8 h-8 text-amber-400 animate-pulse mx-auto" />
                <p className="text-xs text-slate-400">Analizando mazos y calculando porcentajes...</p>
              </div>
            ) : filteredFrequentCards.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
                <Flame className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
                <h3 className="font-bold text-base text-slate-300">No se encontraron cartas</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {totalDecksAnalyzed === 0
                    ? 'Aún no hay mazos guardados para calcular las cartas más frecuentes. ¡Crea o importa el primero!'
                    : 'No hay cartas que coincidan con los filtros seleccionados.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredFrequentCards.map((card: any) => {
                  const rank = card.rank;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <div
                      key={card.card_name}
                      className="group relative flex gap-3 p-3.5 rounded-2xl bg-[#0c1322]/90 border border-slate-800/80 hover:border-amber-500/40 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-amber-950/20"
                    >
                      {/* Rank Medal / Badge */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        {isTop1 ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow">
                            🥇 #1
                          </span>
                        ) : isTop2 ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-300/20 text-slate-200 border border-slate-400/60 shadow">
                            🥈 #2
                          </span>
                        ) : isTop3 ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-700/20 text-amber-400 border border-amber-700/60 shadow">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-[11px] font-extrabold font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            #{rank}
                          </span>
                        )}
                      </div>

                      {/* Card Thumbnail */}
                      <div className="relative w-16 h-24 flex-shrink-0 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                        <img
                          src={card.image_url || getGenericEnergyImage(card.card_name) || '/placeholder-card.svg'}
                          alt={card.card_name}
                          loading="lazy"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const generic = getGenericEnergyImage(card.card_name);
                            if (generic && !target.src.includes(generic)) {
                              target.src = generic;
                            } else {
                              target.src = '/placeholder-card.svg';
                            }
                          }}
                        />
                      </div>

                      {/* Card Info & Usage Percentage */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 pr-10">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                              card.category === 'pokemon'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                                : card.category === 'trainer'
                                ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                            }`}>
                              {card.category}
                            </span>
                            {card.expansion && (
                              <span className="text-[10px] text-slate-400 truncate font-mono">
                                {card.expansion} #{card.number}
                              </span>
                            )}
                          </div>

                          <h4 className="font-extrabold text-sm text-white truncate" title={card.card_name}>
                            {card.card_name}
                          </h4>
                        </div>

                        {/* Usage Progress Bar & Percentage */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] text-slate-400 font-semibold">Uso en Mazos</span>
                            <span className="text-sm font-black text-amber-400 font-mono">
                              {card.usage_percentage}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(5, card.usage_percentage))}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span>{card.deck_appearances} de {totalDecksAnalyzed} {totalDecksAnalyzed === 1 ? 'mazo' : 'mazos'}</span>
                            <span className="text-slate-500">~{card.avg_copies} un/mazo</span>
                          </div>

                          {/* Store link / availability */}
                          <div className="pt-1.5 flex items-center justify-between">
                            {card.in_store ? (
                              <Link
                                href={`/?search=${encodeURIComponent(card.card_name)}`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 transition-colors"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>En Stock (${card.store_price?.toLocaleString('es-AR')})</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/?search=${encodeURIComponent(card.card_name)}`}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                              >
                                <Search className="w-3 h-3" />
                                <span>Buscar en Tienda</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}


      </main>

      {/* Import PTCGL Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div onClick={() => setImportModalOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="min-h-full flex items-center justify-center p-4">
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xl bg-[#0d1629] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Importar Mazo (Limitless / PTCGL)</span>
                </h3>
                <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  {importError}
                </div>
              )}

              <form onSubmit={handleProcessImport} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nombre del Mazo</label>
                  <input
                    type="text"
                    value={importName}
                    onChange={(e) => setImportName(e.target.value)}
                    placeholder="Ej: Mi Mazo Charizard"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Lista en formato estándar (Pega aquí desde Limitless TCG o Pokémon TCG Live):
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Pokémon: 12&#10;4 Charmander MEW 4&#10;...&#10;Trainer: 36&#10;4 Ultra Ball SVI 196&#10;...&#10;Energy: 12&#10;12 Basic Fire Energy SVE 2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                  >
                    Importar y Cargar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
