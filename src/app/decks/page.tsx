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
} from 'lucide-react';
import { parsePtcglDeck } from '@/lib/deckParser';



export default function DecksPage() {
  const router = useRouter();
  const [myDecks, setMyDecks] = useState<any[]>([]);
  const [communityDecks, setCommunityDecks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'community'>('my');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importName, setImportName] = useState('');
  const [importError, setImportError] = useState('');
  const [savingImport, setSavingImport] = useState(false);

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
