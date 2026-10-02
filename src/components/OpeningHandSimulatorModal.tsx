'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Shuffle,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DeckCardItem } from '@/app/deck-builder/page';

interface OpeningHandSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckName: string;
  cards: DeckCardItem[];
}

interface SingleCard {
  uid: string;
  card_name: string;
  expansion?: string;
  number?: string;
  image_url?: string;
  category?: 'pokemon' | 'trainer' | 'energy';
}

export function OpeningHandSimulatorModal({
  isOpen,
  onClose,
  deckName,
  cards,
}: OpeningHandSimulatorModalProps) {
  const [shuffling, setShuffling] = useState(false);
  const [shuffleStep, setShuffleStep] = useState(0); // Animation phases
  const [hand, setHand] = useState<SingleCard[]>([]);
  const [mulliganCount, setMulliganCount] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Expand cards according to count (e.g. 4x Pikachu => 4 distinct items in deck)
  const fullDeckList = useMemo(() => {
    const list: SingleCard[] = [];
    cards.forEach((item, itemIdx) => {
      const count = Number(item.count) || 1;
      for (let i = 0; i < count; i++) {
        list.push({
          uid: `${item.card_name}-${item.expansion || ''}-${item.number || ''}-${itemIdx}-${i}`,
          card_name: item.card_name,
          expansion: item.expansion,
          number: item.number,
          image_url: item.image_url,
          category: item.category,
        });
      }
    });
    return list;
  }, [cards]);

  const drawOpeningHand = () => {
    if (fullDeckList.length === 0) return;

    setPreviewIndex(null);
    setShuffling(true);
    setShuffleStep(1);

    // Step 1: Pan / riffle shuffle animation
    setTimeout(() => {
      setShuffleStep(2);
    }, 450);

    // Step 2: Cut deck & split
    setTimeout(() => {
      setShuffleStep(3);
    }, 900);

    // Step 3: Draw 7 cards
    setTimeout(() => {
      // Fisher-Yates shuffle copy of deck
      const shuffled = [...fullDeckList];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const drawn7 = shuffled.slice(0, 7);
      setHand(drawn7);

      // Check if hand has at least one basic Pokemon (mulligan rule)
      const hasPokemon = drawn7.some(
        (c) => c.category === 'pokemon' || (!c.category && !c.card_name.toLowerCase().includes('energy'))
      );

      if (!hasPokemon) {
        setMulliganCount((prev) => prev + 1);
      }

      setShuffling(false);
      setShuffleStep(0);
    }, 1300);
  };

  useEffect(() => {
    if (isOpen) {
      setMulliganCount(0);
      drawOpeningHand();
    } else {
      setHand([]);
      setPreviewIndex(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasPokemon = hand.some(
    (c) => c.category === 'pokemon' || (!c.category && !c.card_name.toLowerCase().includes('energy'))
  );

  const previewCard = previewIndex !== null && hand[previewIndex] ? hand[previewIndex] : null;

  const handleNextPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewIndex === null) return;
    setPreviewIndex((previewIndex + 1) % hand.length);
  };

  const handlePrevPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewIndex === null) return;
    setPreviewIndex((previewIndex - 1 + hand.length) % hand.length);
  };

  return (
    <>
      {/* Modal Principal tapete de juego */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        />

        <div className="min-h-full flex items-center justify-center p-3 sm:p-5">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-[#090e1a] border border-blue-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col space-y-4 p-5 sm:p-7 text-white"
          >
            {/* Top Title Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
                  <Shuffle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Simulador de Primera Mano
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700">
                      7 Cartas
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {deckName || 'Mazo Actual'} · Total de cartas: {fullDeckList.length}/60
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 transition-colors"
                title="Cerrar simulador"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table Mat / Playmat Container */}
            <div className="relative min-h-[380px] sm:min-h-[440px] rounded-2xl bg-gradient-to-b from-[#0a1122] via-[#060a14] to-[#04060c] border border-white/10 p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Playmat subtle texture & stadium glow */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Status indicator bar (Mulligan / Valid Hand) */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {!shuffling && hand.length > 0 && (
                    <>
                      {hasPokemon ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 font-bold shadow-md shadow-emerald-950/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Mano Válida (Contiene Pokémon)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/60 font-bold shadow-md shadow-rose-950/50 animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          ¡Mulligan! (Sin Pokémon Básico)
                        </span>
                      )}
                    </>
                  )}

                  {mulliganCount > 0 && (
                    <span className="text-[11px] text-amber-300 bg-amber-950/50 border border-amber-600/40 px-2 py-0.5 rounded-md font-semibold">
                      Mulligans acumulados: {mulliganCount}
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">
                  Haz clic en cualquier carta para verla ampliada por encima de la mano
                </span>
              </div>

              {/* Shuffling Animation View */}
              {shuffling ? (
                <div className="relative z-10 flex flex-col items-center justify-center my-auto py-12 space-y-6">
                  {/* Riffle Deck Shuffle visual effect */}
                  <div className="relative w-36 h-48 flex items-center justify-center">
                    {/* Left Deck Stack */}
                    <div
                      className={`absolute w-28 h-40 rounded-xl bg-slate-900 border-2 border-blue-500/60 shadow-2xl transition-all duration-300 flex items-center justify-center ${
                        shuffleStep === 1
                          ? '-translate-x-12 -rotate-12 scale-105'
                          : shuffleStep === 2
                          ? '-translate-x-6 rotate-6'
                          : 'translate-x-0 rotate-0'
                      }`}
                    >
                      <img
                        src="/card-back.png"
                        alt="Reverso"
                        className="w-full h-full object-cover rounded-lg opacity-85"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Right Deck Stack */}
                    <div
                      className={`absolute w-28 h-40 rounded-xl bg-slate-900 border-2 border-indigo-500/60 shadow-2xl transition-all duration-300 flex items-center justify-center ${
                        shuffleStep === 1
                          ? 'translate-x-12 rotate-12 scale-105'
                          : shuffleStep === 2
                          ? 'translate-x-6 -rotate-6'
                          : 'translate-x-0 rotate-0'
                      }`}
                    >
                      <img
                        src="/card-back.png"
                        alt="Reverso"
                        className="w-full h-full object-cover rounded-lg opacity-85"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Sparkle Center */}
                    <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none">
                      <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-white tracking-wide flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Mezclando el mazo de {fullDeckList.length} cartas...</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Repartiendo la primera mano de 7 cartas aleatorias
                    </p>
                  </div>
                </div>
              ) : (
                /* Hand of 7 Cards Display */
                <div className="relative z-10 my-auto py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-3.5">
                    {hand.map((card, idx) => (
                      <div
                        key={card.uid}
                        onClick={() => setPreviewIndex(idx)}
                        className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-105"
                        style={{
                          animation: `card-deal 0.35s ease-out backwards ${idx * 0.08}s`,
                        }}
                      >
                        {/* Card Frame */}
                        <div className="relative aspect-[2.5/3.5] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 group-hover:border-blue-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
                          <img
                            src={card.image_url || '/placeholder-card.svg'}
                            alt={card.card_name}
                            className="w-full h-full object-contain filter drop-shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-card.svg';
                            }}
                          />

                          {/* Order badge #1..#7 */}
                          <div className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md border border-white/20">
                            #{idx + 1}
                          </div>

                          {/* Hover Overlay Icon */}
                          <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        </div>

                        {/* Card Name */}
                        <p className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate w-full text-center mt-1.5">
                          {card.card_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>
                    {shuffling
                      ? 'Mezclando...'
                      : `Mostrando 7 de ${fullDeckList.length} cartas`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={drawOpeningHand}
                    disabled={shuffling || fullDeckList.length < 7}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <Shuffle className={`w-4 h-4 ${shuffling ? 'animate-spin' : ''}`} />
                    <span>Volver a Mezclar y Repartir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Preview Lightbox Modal (z-[100] completely above everything with backdrop) */}
      {previewCard && (
        <div
          onClick={() => setPreviewIndex(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Navigation Prev Button */}
          {hand.length > 1 && (
            <button
              onClick={handlePrevPreview}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 z-10"
              title="Carta anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Navigation Next Button */}
          {hand.length > 1 && (
            <button
              onClick={handleNextPreview}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 z-10"
              title="Siguiente carta"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full flex flex-col items-center space-y-3 z-10"
          >
            {/* Top Close Button */}
            <div className="w-full flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-600/40">
                Carta #{previewIndex !== null ? previewIndex + 1 : 1} de 7
              </span>

              <button
                onClick={() => setPreviewIndex(null)}
                className="p-2 rounded-xl bg-slate-850 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Cerrar vista"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Focused Enlarged Card */}
            <div className="w-full max-w-[300px] sm:max-w-[320px] aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.35)] border-2 border-white/30 bg-slate-950">
              <img
                src={previewCard.image_url || '/placeholder-card.svg'}
                alt={previewCard.card_name}
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </div>

            {/* Card Information */}
            <div className="text-center pt-2 space-y-1">
              <h4 className="font-black text-white text-lg">
                {previewCard.card_name}
              </h4>
              <p className="text-xs text-slate-400">
                {previewCard.expansion || 'Expansión'} · #{previewCard.number || '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS Keyframes for dealing cards */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes card-deal {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `,
        }}
      />
    </>
  );
}
