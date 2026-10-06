'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Sparkles,
  User,
  ShieldCheck,
  Box,
  ShoppingBag,
  Check,
  SlidersHorizontal,
  Edit2,
  Tag,
  DollarSign,
} from 'lucide-react';
import { CardData, CardSellerOffer } from './CardItem';
import { useCart } from '@/context/CartContext';
import Card3DViewer from './Card3DViewer';
import { LanguageBadge, FlagES, FlagUS } from './FlagIcon';
import { isBasicEnergy, getGenericEnergyImage } from '@/lib/deckParser';
import EditCardModal from './EditCardModal';

interface CardDetailModalProps {
  card: CardData | null;
  onClose: () => void;
  onCardUpdated?: (updatedCard: CardData) => void;
}

export default function CardDetailModal({
  card,
  onClose,
  onCardUpdated,
}: CardDetailModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Offers and user state
  const [offers, setOffers] = useState<CardSellerOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [editingCardData, setEditingCardData] = useState<CardData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getInitialImg = () => {
    if (card?.image_url && !card.image_url.includes('placeholder')) return card.image_url;
    if (card && isBasicEnergy({ name: card.name, expansion: card.expansion })) {
      return getGenericEnergyImage(card.name) || '/placeholder-card.svg';
    }
    return card?.image_url || '/placeholder-card.svg';
  };

  const [imgSrc, setImgSrc] = useState(getInitialImg);

  // Fetch current user on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // When card opens or changes
  useEffect(() => {
    if (card) {
      setImgSrc(getInitialImg());
      setQuantity(1);

      // Initialize with preloaded offers if present
      if (card.offers && card.offers.length > 0) {
        setOffers(card.offers);
        setSelectedOfferId(card.offers[0].id);
      } else {
        const defaultOffer: CardSellerOffer = {
          id: card.id,
          seller_id: card.seller_id,
          seller_name: card.seller_name || 'Luca',
          seller_phone: card.seller_phone || '',
          price: card.price,
          stock: card.stock,
          notes: card.notes,
          is_foil: card.is_foil,
          is_league: card.is_league,
        };
        setOffers([defaultOffer]);
        setSelectedOfferId(card.id);
      }

      // Also fetch fresh offers from backend to ensure all current sellers are displayed
      fetch(`/api/cards/${card.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.offers && data.offers.length > 0) {
            setOffers(data.offers);
            setSelectedOfferId((prev) => prev || data.offers[0].id);
          }
        })
        .catch(() => {});
    }
  }, [card]);

  if (!card) return null;

  // Selected offer
  const selectedOffer: CardSellerOffer =
    offers.find((o) => o.id === selectedOfferId) ||
    offers[0] || {
      id: card.id,
      seller_id: card.seller_id,
      seller_name: card.seller_name || 'Luca',
      seller_phone: card.seller_phone || '',
      price: card.price,
      stock: card.stock,
      notes: card.notes,
      is_foil: card.is_foil,
      is_league: card.is_league,
    };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAdd = () => {
    if (selectedOffer.stock <= 0) return;
    const itemToAdd = {
      ...card,
      id: selectedOffer.id,
      price: selectedOffer.price,
      stock: selectedOffer.stock,
      seller_id: selectedOffer.seller_id,
      seller_name: selectedOffer.seller_name,
      seller_phone: selectedOffer.seller_phone,
      notes: selectedOffer.notes,
    };

    addToCart(itemToAdd, quantity);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  };

  const isOutOfStock = selectedOffer.stock <= 0;

  // Check if current user is owner of the selected offer or admin
  const canEditSelected =
    currentUser &&
    (currentUser.username.toLowerCase() === 'luca' ||
      currentUser.role === 'admin' ||
      currentUser.role === 'owner' ||
      currentUser.id === selectedOffer.seller_id ||
      currentUser.username.toLowerCase() === (selectedOffer.seller_name || '').toLowerCase());

  const handleCardSaved = (updatedCard: CardData) => {
    // Update offers list
    setOffers((prev) =>
      prev.map((o) =>
        o.id === updatedCard.id
          ? {
              ...o,
              price: updatedCard.price,
              stock: updatedCard.stock,
              notes: updatedCard.notes,
              seller_name: updatedCard.seller_name || o.seller_name,
            }
          : o
      )
    );

    // Call parent listener if any
    onCardUpdated?.(updatedCard);
  };

  return (
    <>
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
                  isHolo={
                    card.is_foil === 1 ||
                    card.version?.toLowerCase().includes('foil') ||
                    card.version?.toLowerCase().includes('holo') ||
                    card.version?.toLowerCase().includes('secret')
                  }
                />

                {/* Disclaimer */}
                <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 shadow-sm max-w-xs">
                  <span className="text-blue-400 font-bold">ℹ️</span>
                  <span>Imagen y animación 3D de referencia ilustrativa.</span>
                </div>
              </div>

              {/* Card Information Right */}
              <div className="p-6 md:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  {/* Expansión, Number, Version, FOIL & Language */}
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
                    {(card.is_foil === 1 || card.version?.toLowerCase().includes('foil')) && (
                      <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 text-amber-300 font-black border border-amber-500/40 flex items-center gap-1 shadow-sm">
                        ✨ FOIL
                      </span>
                    )}
                    {card.is_league === 1 && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-950/80 text-red-200 font-black border border-red-700/60 flex items-center gap-1.5 shadow-sm">
                        <img
                          src="/prize-pack-stamp.png"
                          alt="Play! Pokémon League Prize Pack"
                          className="w-4 h-3.5 object-contain"
                        />
                        <span>Carta de Liga (Prize Pack)</span>
                      </span>
                    )}
                    <LanguageBadge language={card.language} size="md" />
                  </div>

                  {/* Name & Quick Edit Option */}
                  <div className="flex items-start justify-between gap-2">
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

                    {canEditSelected && (
                      <button
                        onClick={() => {
                          setEditingCardData({
                            ...card,
                            id: selectedOffer.id,
                            price: selectedOffer.price,
                            stock: selectedOffer.stock,
                            notes: selectedOffer.notes,
                            seller_id: selectedOffer.seller_id,
                            seller_name: selectedOffer.seller_name,
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shrink-0 hover:scale-105 active:scale-95"
                        title="Modificar los datos de esta publicación"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>

                  {/* Metadata details */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs sm:text-sm">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Idioma
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
                  </div>

                  {/* Multiple Sellers Section */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                        <span>
                          {offers.length > 1
                            ? `Vendedores disponibles (${offers.length} opciones)`
                            : 'Vendido por'}
                        </span>
                      </span>
                      {offers.length > 1 && (
                        <span className="text-[10px] text-slate-400">
                          Selecciona una opción
                        </span>
                      )}
                    </div>

                    {offers.length === 1 ? (
                      /* Single Seller Display */
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                        <div className="space-y-0.5">
                          <span className="font-bold text-blue-300 text-xs sm:text-sm">
                            {selectedOffer.seller_name || 'Luca'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {selectedOffer.stock > 0
                              ? `${selectedOffer.stock} unidades disponibles`
                              : 'Agotado'}
                          </span>
                          {selectedOffer.notes && (
                            <span className="text-[10px] text-slate-400 block italic">
                              "{selectedOffer.notes}"
                            </span>
                          )}
                        </div>
                        <span className="text-base font-black text-white">
                          {formatPrice(selectedOffer.price)}
                        </span>
                      </div>
                    ) : (
                      /* Multiple Sellers List */
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {offers.map((offer, idx) => {
                          const isSelected = offer.id === selectedOffer.id;
                          const isCheapest = idx === 0 || offer.price === offers[0].price;
                          const canEditThis =
                            currentUser &&
                            (currentUser.username.toLowerCase() === 'luca' ||
                              currentUser.role === 'admin' ||
                              currentUser.role === 'owner' ||
                              currentUser.id === offer.seller_id ||
                              currentUser.username.toLowerCase() ===
                                (offer.seller_name || '').toLowerCase());

                          return (
                            <div
                              key={offer.id}
                              onClick={() => {
                                setSelectedOfferId(offer.id);
                                setQuantity(1);
                              }}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/30 ring-1 ring-blue-500/50'
                                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="radio"
                                  name="seller_offer_selection"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedOfferId(offer.id);
                                    setQuantity(1);
                                  }}
                                  className="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-xs text-white truncate">
                                      {offer.seller_name || 'Vendedor'}
                                    </span>
                                    {isCheapest && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600/70 shadow-sm flex items-center gap-0.5">
                                        <span>🏷️ Más barata</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                    <span
                                      className={
                                        offer.stock > 0
                                          ? 'text-emerald-400 font-semibold'
                                          : 'text-rose-400 font-semibold'
                                      }
                                    >
                                      {offer.stock > 0
                                        ? `${offer.stock} en stock`
                                        : 'Agotado'}
                                    </span>
                                    {offer.notes && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-[140px] text-slate-400">
                                          {offer.notes}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-black text-white">
                                  {formatPrice(offer.price)}
                                </span>

                                {canEditThis && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCardData({
                                        ...card,
                                        id: offer.id,
                                        price: offer.price,
                                        stock: offer.stock,
                                        notes: offer.notes,
                                        seller_id: offer.seller_id,
                                        seller_name: offer.seller_name,
                                      });
                                      setIsEditModalOpen(true);
                                    }}
                                    className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                                    title="Editar mi publicación"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                        Precio seleccionado
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Vendido por {selectedOffer.seller_name || 'Luca'}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-white">
                      {formatPrice(selectedOffer.price)}
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
                          onClick={() => setQuantity((q) => Math.min(selectedOffer.stock, q + 1))}
                          disabled={quantity >= selectedOffer.stock}
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

      {/* Reusable Edit Publication Modal */}
      <EditCardModal
        card={editingCardData}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCardData(null);
        }}
        onSaved={handleCardSaved}
      />
    </>
  );
}
