'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Check, Sparkles, User, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { LanguageBadge } from './FlagIcon';

export interface CardData {
  id: number;
  name: string;
  expansion: string;
  number: string;
  version: string;
  language?: string;
  artist: string;
  price: number;
  stock: number;
  image_url: string;
  rarity?: string;
  notes?: string;
  category?: string;
  trainer_type?: string;
  seller_id?: number;
  seller_name?: string;
  seller_phone?: string;
  is_foil?: number;
  is_league?: number;
}

interface CardItemProps {
  card: CardData;
  onOpenModal: (card: CardData) => void;
}

export default function CardItem({ card, onOpenModal }: CardItemProps) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(card.image_url || '/placeholder-card.svg');

  React.useEffect(() => {
    setImgSrc(card.image_url || '/placeholder-card.svg');
  }, [card.image_url]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.stock <= 0) return;
    addToCart(card, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Version color coding
  const getVersionBadgeClass = (version: string) => {
    const v = version.toLowerCase();
    if (v.includes('special illustration') || v.includes('secret') || v.includes('hyper') || v.includes('gold')) {
      return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/40';
    }
    if (v.includes('illustration rare') || v.includes('full art') || v.includes('ultra rare') || v.includes('alternate')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
    if (v.includes('reverse')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
    if (v.includes('holo')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const isOutOfStock = card.stock <= 0;

  return (
    <div
      onClick={() => onOpenModal(card)}
      className="group relative flex flex-col bg-[#0f172a]/80 hover:bg-[#131e36] border border-slate-800/80 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-900/20 cursor-pointer"
    >
      {/* Card Image Container with Foil/Shine effect */}
      <div className="relative w-full aspect-[2.5/3.5] bg-slate-950/60 p-3.5 flex items-center justify-center overflow-hidden card-shine">
        {/* Subtle glow behind card */}
        <div className="absolute inset-0 bg-radial from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative w-full h-full max-h-[300px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <Image
            src={imgSrc}
            alt={`${card.name} - ${card.expansion}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain drop-shadow-md rounded-lg"
            priority={false}
            onError={() => setImgSrc('/placeholder-card.svg')}
          />
        </div>

        {/* Stock status badge overlay */}
        <div className="absolute top-3 right-3 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow backdrop-blur-sm">
              Sin stock
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow backdrop-blur-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{card.stock} en stock</span>
            </span>
          )}
        </div>

        {/* Expansion / Number / Language badge overlay */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/90 text-slate-300 border border-slate-700/80 backdrop-blur-sm">
            #{card.number}
          </span>
          <LanguageBadge language={card.language} size="xs" />
        </div>

        {/* Prize Pack Stamp Overlay (Bottom Right Corner) */}
        {card.is_league === 1 && (
          <div
            className="absolute bottom-2.5 right-2.5 z-10 p-1 rounded-md bg-black/80 backdrop-blur-sm border border-red-500/50 shadow-lg flex items-center gap-1"
            title="Carta Oficial de Liga / Prize Pack (Play! Pokémon)"
          >
            <img
              src="/prize-pack-stamp.png"
              alt="Play! Pokémon League"
              className="w-5 h-4 object-contain drop-shadow"
            />
          </div>
        )}
      </div>

      {/* Card Info Section */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Version badge & Foil indicator & League Stamp */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${getVersionBadgeClass(
                card.version
              )}`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>{card.version}</span>
            </span>
            {(card.is_foil === 1 || card.version?.toLowerCase().includes('foil')) && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse">
                ✨ FOIL
              </span>
            )}
            {card.is_league === 1 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-950/80 text-red-200 border border-red-700/60 shadow-sm" title="Carta de Liga / Prize Pack">
                <img src="/prize-pack-stamp.png" alt="Prize Pack" className="w-3.5 h-3 object-contain" />
                <span>Liga</span>
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
              {card.expansion}
            </span>
          </div>

          {/* Card Name */}
          <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {card.name}
          </h3>

          {/* Artist */}
          <div className="flex items-center justify-between gap-1 text-xs text-slate-400 mt-1">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="truncate">{card.artist || 'Ilustrador oficial'}</span>
            </div>
            {/* Seller pill */}
            <span className="flex-shrink-0 text-[10px] font-bold text-blue-300 bg-blue-950/70 px-2 py-0.5 rounded-md border border-blue-800/50">
              Vendido por: {card.seller_name || 'Luca'}
            </span>
          </div>
        </div>

        {/* Price and Cart Action */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
              Precio
            </span>
            <span className="text-base sm:text-lg font-black tracking-tight text-white">
              {formatPrice(card.price)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 hover:scale-105 active:scale-95'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'Agotado' : 'Comprar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
