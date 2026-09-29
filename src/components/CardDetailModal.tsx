'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Sparkles, User, ShieldCheck, Box, ShoppingBag, Check } from 'lucide-react';
import { CardData } from './CardItem';
import { useCart } from '@/context/CartContext';
import Card3DViewer from './Card3DViewer';
import { LanguageBadge, FlagES, FlagUS } from './FlagIcon';

interface CardDetailModalProps {
  card: CardData | null;
  onClose: () => void;
}

export default function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(card?.image_url || '/placeholder-card.svg');

  React.useEffect(() => {
    if (card) {
      setImgSrc(card.image_url || '/placeholder-card.svg');
    }
  }, [card]);

  if (!card) return null;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAdd = () => {
    if (card.stock <= 0) return;
    addToCart(card, quantity);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  };

  const isOutOfStock = card.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl bg-[#0c1322] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Card Visual Left with Interactive 3D Rotation */}
            <div className="relative bg-gradient-to-b from-slate-950 via-[#070c17] to-slate-950 p-6 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
              <Card3DViewer
                frontImage={imgSrc}
                cardName={card.name}
                isHolo={card.version?.toLowerCase().includes('holo') || card.version?.toLowerCase().includes('secret')}
              />
            </div>

            {/* Card Information Right */}
            <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Expansión, Number, Version & Language */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 font-semibold border border-blue-800/50">
                    {card.expansion}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 font-medium border border-slate-800">
                    #{card.number}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 font-semibold border border-purple-800/50 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{card.version}</span>
                  </span>
                  <LanguageBadge language={card.language} size="md" />
                </div>

                {/* Name */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {card.name}
                  </h2>
                  {card.rarity && (
                    <p className="text-xs text-blue-400 font-medium mt-1">
                      Rareza: {card.rarity}
                    </p>
                  )}
                </div>

                {/* Metadata details */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Idioma de la Carta
                    </span>
                    <span className="font-bold text-white flex items-center gap-2">
                      {card.language === 'Español' ? (
                        <>
                          <FlagES className="w-4 h-3 rounded-[1px] shadow-sm" />
                          <span>Español</span>
                        </>
                      ) : (
                        <>
                          <FlagUS className="w-4 h-3 rounded-[1px] shadow-sm" />
                          <span>Inglés</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-4 h-4" /> Artista
                    </span>
                    <span className="font-medium text-white">{card.artist || 'Oficial'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Box className="w-4 h-4" /> Stock disponible
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        card.stock > 0
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                      }`}
                    >
                      {card.stock > 0 ? `${card.stock} unidades` : 'Agotado'}
                    </span>
                  </div>

                  {card.notes && (
                    <div className="pt-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <strong className="text-slate-300 block mb-0.5">Detalles del estado:</strong>
                      {card.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Precio unitario
                  </span>
                  <span className="text-2xl font-black text-white">
                    {formatPrice(card.price)}
                  </span>
                </div>

                {/* Quantity selector & Add to cart */}
                <div className="flex items-center gap-3">
                  {!isOutOfStock && (
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-white px-2">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(card.stock, q + 1))}
                        disabled={quantity >= card.stock}
                        className="text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 ${
                      isOutOfStock
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : justAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 hover:scale-[1.02]'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Agregado al Carrito!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isOutOfStock ? 'Sin Stock Disponible' : 'Agregar al Carrito'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
