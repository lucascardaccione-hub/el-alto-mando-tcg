'use client';

import React, { useRef, useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  X,
  FileText,
  Loader2,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { exportToPtcgl, isBasicEnergy, getBasicEnergyTypeNumber, getGenericEnergyImage, isKnownEnergyTrainer } from '@/lib/deckParser';
import { DeckCardItem } from '@/app/deck-builder/page';

interface DeckImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckName: string;
  format: string;
  cards: DeckCardItem[];
}

// Subcomponent: High-fidelity proxied card thumbnail for clean canvas capture
function ModalCardThumbnail({ card }: { card: DeckCardItem }) {
  const setUpper = (card.expansion || '').toUpperCase().trim();
  const cleanNum = (card.number || '').replace(/^0+/, '');
  const paddedNum = cleanNum.padStart(3, '0');

  let lSet = setUpper;
  if (setUpper === 'PR-SW' || setUpper === 'SWSHP') lSet = 'SP';
  else if (setUpper === 'PR-SV' || setUpper === 'SVP') lSet = 'SVP';
  else if (setUpper === 'PR-SM' || setUpper === 'SMP') lSet = 'SMP';
  else if (setUpper === 'PR-XY' || setUpper === 'XYP') lSet = 'XYP';
  else if (setUpper === 'PR-BW' || setUpper === 'BWP') lSet = 'BWP';
  else if (setUpper === 'SVE' || setUpper.includes('SCARLET & VIOLET ENERGY') || setUpper.includes('SCARLET AND VIOLET ENERGY')) lSet = 'SVE';
  else if (setUpper === 'MEE' || setUpper.includes('MEGA EVOLUTION ENERGY')) lSet = 'MEE';

  const candidateUrls = useMemo(() => {
    const list: string[] = [];

    // 1. Direct card.image_url if present and not a placeholder
    if (card.image_url && !card.image_url.includes('placeholder')) {
      list.push(card.image_url);
    }

    // 2. Limitless CDN variations
    if (lSet === 'SP') {
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SP/SP_${cleanNum}_R_EN_SM.png`);
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SP/SP_${paddedNum}_R_EN_SM.png`);
    } else if (lSet && cleanNum) {
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${lSet}/${lSet}_${paddedNum}_R_EN_SM.png`);
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${lSet}/${lSet}_${cleanNum}_R_EN_SM.png`);
      list.push(`https://limitless3.nyc3.cdn.digitaloceanspaces.com/tpci/${lSet}/${lSet}_${paddedNum}_R_EN_SM.png`);
    }

    if (setUpper === 'MEE' || setUpper === 'SVE' || lSet === 'MEE' || lSet === 'SVE') {
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/MEE/MEE_${paddedNum}_R_EN_SM.png`);
      list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SVE/SVE_${paddedNum}_R_EN_SM.png`);
    }

    // 3. Basic Energy generic fallback (Local crisp standard images)
    if (isBasicEnergy(card)) {
      const genericImg = getGenericEnergyImage(card.card_name);
      if (genericImg) {
        list.push(genericImg);
      }
      const typeNum = getBasicEnergyTypeNumber(card.card_name);
      if (typeNum) {
        list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SVE/SVE_00${typeNum}_R_EN_SM.png`);
        list.push(`https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/MEE/MEE_00${typeNum}_R_EN_SM.png`);
      }
    }

    // 4. Store card matched image
    if (card.store_card?.image_url) {
      list.push(card.store_card.image_url);
    }

    list.push('/placeholder-card.svg');
    return Array.from(new Set(list));
  }, [card.expansion, card.number, card.image_url, card.store_card, card.card_name, lSet, cleanNum, paddedNum, setUpper]);

  const [srcIndex, setSrcIndex] = useState(0);

  const rawUrl = candidateUrls[srcIndex] || '/placeholder-card.svg';
  // Use unique path segment per card to prevent canvas/html-to-image cache collisions
  const cardSlug = `${(setUpper || 'CARD').replace(/[^a-zA-Z0-9]/g, '')}_${(cleanNum || '1').replace(/[^a-zA-Z0-9]/g, '')}_${(card.card_name || '').replace(/[^a-zA-Z0-9]/g, '')}`;
  const displaySrc = rawUrl.startsWith('http')
    ? `/api/proxy-image/${cardSlug}?url=${encodeURIComponent(rawUrl)}`
    : rawUrl;

  const handleError = () => {
    if (srcIndex + 1 < candidateUrls.length) {
      setSrcIndex((prev) => prev + 1);
    }
  };

  return (
    <img
      src={displaySrc}
      alt={card.card_name}
      crossOrigin="anonymous"
      loading="eager"
      className="w-full h-full object-contain"
      onError={handleError}
    />
  );
}

export default function DeckImageModal({
  isOpen,
  onClose,
  deckName,
  format,
  cards,
}: DeckImageModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedList, setCopiedList] = useState(false);

  // Responsive mobile scaling state
  const [fitMode, setFitMode] = useState<'fit' | 'full'>('fit');
  const [scale, setScale] = useState(1);
  const [boardHeight, setBoardHeight] = useState(0);

  // Measure container and update scale
  React.useEffect(() => {
    if (!isOpen) return;

    const measureAndScale = () => {
      if (!scrollContainerRef.current) return;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const padding = window.innerWidth < 640 ? 16 : 32;
      const availableWidth = Math.max(280, containerWidth - padding);
      const computedScale = Math.min(1, availableWidth / 1040);
      setScale(computedScale);

      if (boardRef.current) {
        setBoardHeight(boardRef.current.scrollHeight || boardRef.current.offsetHeight);
      }
    };

    measureAndScale();
    const timer = setTimeout(measureAndScale, 200);
    window.addEventListener('resize', measureAndScale);
    return () => {
      window.removeEventListener('resize', measureAndScale);
      clearTimeout(timer);
    };
  }, [isOpen, cards]);

  // Track board height dynamically when cards or images load
  React.useEffect(() => {
    if (!isOpen || !boardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === boardRef.current) {
          setBoardHeight(entry.target.scrollHeight || entry.contentRect.height);
        }
      }
    });
    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Sort cards into standard Limitless competitive order:
  // 1. Pokémon
  // 2. Trainers (Supporters -> Items -> Tools -> Stadiums)
  // 3. Energies (Special -> Basic)
  const sortedCards = useMemo(() => {
    const pokemons = cards.filter((c) => c.category === 'pokemon' && !isKnownEnergyTrainer(c.card_name));
    const trainers = cards.filter((c) => c.category === 'trainer' || isKnownEnergyTrainer(c.card_name));
    const energies = cards.filter((c) => c.category === 'energy' && !isKnownEnergyTrainer(c.card_name));

    // Sub-sort trainers
    const supporters = trainers.filter((c) => {
      const type = (c.trainer_type || '').toLowerCase();
      const name = c.card_name.toLowerCase();
      return (
        type.includes('supporter') ||
        type.includes('partidario') ||
        name.includes("orders") ||
        name.includes("research") ||
        name.includes("determination") ||
        name.includes("compassion") ||
        name.includes("encouragement") ||
        name.includes("machinations") ||
        name.includes("petrel") ||
        name.includes("iono") ||
        name.includes("arven") ||
        name.includes("colress") ||
        name.includes("hilda") ||
        name.includes("judge") ||
        name.includes("crispin")
      );
    });

    const otherTrainers = trainers.filter((c) => !supporters.includes(c));

    // Sub-sort energies: Special first, then Basic
    const specialEnergies = energies.filter((c) => !isBasicEnergy(c));
    const basicEnergies = energies.filter((c) => isBasicEnergy(c));

    return [
      ...pokemons,
      ...supporters,
      ...otherTrainers,
      ...specialEnergies,
      ...basicEnergies,
    ];
  }, [cards]);

  const totalCards = useMemo(() => cards.reduce((acc, c) => acc + c.count, 0), [cards]);

  // Download high-resolution PNG
  const handleDownload = async () => {
    if (!boardRef.current) return;
    setGenerating(true);
    const prevTransform = boardRef.current.style.transform;
    const prevOrigin = boardRef.current.style.transformOrigin;
    boardRef.current.style.transform = 'none';
    boardRef.current.style.transformOrigin = 'top left';

    try {
      // Use pixelRatio: 2 for sharp 2x retina export, includeQueryParams: true to preserve distinct card URLs
      const dataUrl = await toPng(boardRef.current, {
        cacheBust: false,
        includeQueryParams: true,
        pixelRatio: 2,
        backgroundColor: '#070b14',
        style: {
          transform: 'none',
        },
      });

      const safeName = (deckName || 'Mazo').replace(/[^a-zA-Z0-9_-]/g, '_');
      const link = document.createElement('a');
      link.download = `${safeName}_decklist.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating deck image:', err);
    } finally {
      if (boardRef.current) {
        boardRef.current.style.transform = prevTransform;
        boardRef.current.style.transformOrigin = prevOrigin;
      }
      setGenerating(false);
    }
  };

  // Copy image to clipboard
  const handleCopyImage = async () => {
    if (!boardRef.current) return;
    setGenerating(true);
    const prevTransform = boardRef.current.style.transform;
    const prevOrigin = boardRef.current.style.transformOrigin;
    boardRef.current.style.transform = 'none';
    boardRef.current.style.transformOrigin = 'top left';

    try {
      const blob = await toBlob(boardRef.current, {
        cacheBust: false,
        includeQueryParams: true,
        pixelRatio: 2,
        backgroundColor: '#070b14',
        style: {
          transform: 'none',
        },
      });

      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        // Fallback to direct download if clipboard API is restricted
        handleDownload();
      }
    } catch (err) {
      console.error('Error copying deck image:', err);
      // Fallback to download
      handleDownload();
    } finally {
      if (boardRef.current) {
        boardRef.current.style.transform = prevTransform;
        boardRef.current.style.transformOrigin = prevOrigin;
      }
      setGenerating(false);
    }
  };

  // Copy PTCGL text
  const handleCopyText = () => {
    const text = exportToPtcgl(cards);
    navigator.clipboard.writeText(text);
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2000);
  };

  const isScaled = fitMode === 'fit' && scale < 1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-6xl bg-[#090e1a] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col space-y-3 sm:space-y-4 p-3 sm:p-6"
        >
          {/* Modal Header & Action Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3 sm:pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                <ImageIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base md:text-lg text-white flex items-center gap-2 flex-wrap">
                  <span>Lista de Mazo en Imagen</span>
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/50 font-bold">
                    Visualizador TCG Pro
                  </span>
                  {isScaled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-semibold">
                      Ajustado ({Math.round(scale * 100)}%)
                    </span>
                  )}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Visualización completa de las 60 cartas en alta definición adaptada a tu pantalla.
                </p>
              </div>
            </div>

            {/* Actions & View Controls */}
            <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
              {/* Fit / Zoom Mode Toggle on screens < 1040px */}
              {scale < 0.98 && (
                <div className="inline-flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <button
                    onClick={() => setFitMode('fit')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      fitMode === 'fit'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Ajustar imagen completa al ancho de la pantalla"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Ajustar</span>
                  </button>
                  <button
                    onClick={() => setFitMode('full')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      fitMode === 'full'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Ver en resolución 100% con desplazamiento horizontal"
                  >
                    <ZoomIn className="w-3 h-3" />
                    <span>100%</span>
                  </button>
                </div>
              )}

              <button
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
                title="Copiar texto en formato PTCGL"
              >
                {copiedList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-blue-400" />}
                <span className="hidden xs:inline">{copiedList ? '¡Copiado!' : 'Copiar Texto'}</span>
                <span className="xs:hidden">Texto</span>
              </button>

              <button
                onClick={handleCopyImage}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Copiar imagen directamente al portapapeles"
              >
                {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                <span className="hidden xs:inline">{copiedImage ? '¡Imagen Copiada!' : 'Copiar Imagen'}</span>
                <span className="xs:hidden">Copiar</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-950/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Descargar imagen PNG en alta resolución"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Descargar PNG</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Container with responsive auto-fitted capture board */}
          <div
            ref={scrollContainerRef}
            className={`w-full ${
              fitMode === 'full' ? 'overflow-x-auto' : 'overflow-x-hidden'
            } overflow-y-auto max-h-[78vh] rounded-2xl bg-black/50 p-1 sm:p-3 flex justify-center`}
          >
            {/* Wrapper that bounds layout height when scaled */}
            <div
              style={{
                width: isScaled ? `${Math.ceil(1040 * scale)}px` : '1040px',
                height: isScaled && boardHeight > 0 ? `${Math.ceil(boardHeight * scale)}px` : 'auto',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {/* THE CAPTURE BOARD (Converted to PNG) */}
              <div
                ref={boardRef}
                style={{
                  width: '1040px',
                  minWidth: '1040px',
                  transform: isScaled ? `scale(${scale})` : 'none',
                  transformOrigin: 'top left',
                  backgroundImage: 'radial-gradient(circle at 50% 0%, #111a33 0%, #070b14 75%)',
                }}
                className="p-4 sm:p-6 rounded-2xl border border-slate-800/90 shadow-2xl flex flex-col space-y-5 text-white select-none relative"
              >
              {/* Subtle Limitless-like Diamond Lattice Overlay */}
              <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none rounded-2xl"
                style={{
                  backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Board Header Banner */}
              <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>{deckName || 'Mazo Pokémon TCG'}</span>
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-bold text-blue-400">{format}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-300">{totalCards} Cartas</span>
                    <span>·</span>
                    <span className="text-slate-500">PTCGL Standard</span>
                  </div>
                </div>

                {/* El Alto Mando Branding */}
                <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-md shadow-blue-500/30">
                    ⚡
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-wide text-white block leading-tight">
                      EL ALTO MANDO
                    </span>
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block">
                      TCG STORE & LIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* 8-COLUMN GRID (Limitless Exact Pattern) */}
              <div className="relative z-10 grid grid-cols-8 gap-3">
                {sortedCards.map((card, idx) => (
                  <div
                    key={`image-deck-${card.card_name}-${card.number}-${idx}`}
                    className="relative flex flex-col items-center group pb-2"
                  >
                    {/* Card Thumbnail */}
                    <div className="relative aspect-[2.5/3.5] w-full rounded-md overflow-hidden bg-slate-950 border border-slate-700/60 shadow-md">
                      <ModalCardThumbnail card={card} />
                    </div>

                    {/* LIMITLESS-STYLE HEXAGONAL COUNT BADGE */}
                    <div className="absolute -bottom-1 z-20 flex items-center justify-center pointer-events-none">
                      <div
                        className="bg-gradient-to-b from-red-600 via-rose-700 to-red-800 text-white font-black text-xs px-2 py-0.5 shadow-xl shadow-black border border-red-400/80 flex items-center justify-center min-w-[24px]"
                        style={{
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                          paddingLeft: '7px',
                          paddingRight: '7px',
                          height: '20px',
                        }}
                      >
                        <span className="leading-none">{card.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Board Footer */}
              <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Armado con el Deck Builder de El Alto Mando TCG</span>
                <span className="font-semibold text-slate-400">elaltomando.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
