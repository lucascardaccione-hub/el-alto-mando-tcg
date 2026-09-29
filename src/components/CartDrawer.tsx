'use client';

import React from 'react';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag, Send, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { LanguageBadge } from './FlagIcon';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCount,
    totalPrice,
  } = useCart();

  if (!isOpen) return null;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Group items by seller
  const sellerGroups = React.useMemo(() => {
    const groups: { [key: string]: { sellerName: string; sellerPhone: string; items: typeof items; subtotal: number; count: number } } = {};
    items.forEach((item) => {
      const sellerKey = (item.seller_name || 'Luca').trim();
      if (!groups[sellerKey]) {
        groups[sellerKey] = {
          sellerName: sellerKey,
          sellerPhone: item.seller_phone || '',
          items: [],
          subtotal: 0,
          count: 0,
        };
      }
      groups[sellerKey].items.push(item);
      groups[sellerKey].subtotal += item.price * item.quantity;
      groups[sellerKey].count += item.quantity;
    });
    return Object.values(groups);
  }, [items]);

  // Pre-generate WhatsApp message for a specific seller group
  const generateWhatsAppMessageForGroup = (group: { sellerName: string; sellerPhone: string; items: typeof items; subtotal: number }) => {
    let text = `👋 *Hola ${group.sellerName}!* Quisiera consultar por el siguiente pedido de cartas en *El Alto Mando TCG*:\n\n`;
    group.items.forEach((item, index) => {
      text += `${index + 1}. *${item.name}* (${item.expansion} #${item.number})\n`;
      text += `   • Idioma: ${item.language || 'Inglés'}\n`;
      text += `   • Versión: ${item.version}\n`;
      text += `   • Cantidad: ${item.quantity}\n`;
      text += `   • Subtotal: ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    text += `💰 *TOTAL A COORDINAR:* ${formatPrice(group.subtotal)}\n\n¿Tienes disponible para coordinar el retiro/envío? Muchas gracias!`;
    const cleanPhone = (group.sellerPhone || '').replace(/[^\d]/g, '');
    return `https://wa.me/${cleanPhone ? cleanPhone : ''}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0b1220] border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">Carrito de Compras</h2>
                <p className="text-xs text-slate-400">
                  {totalCount} {totalCount === 1 ? 'carta' : 'cartas'} seleccionadas
                </p>
              </div>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="font-semibold text-slate-300">Tu carrito está vacío</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Explora el catálogo y añade las cartas que desees adquirir para armar tu pedido.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all"
                >
                  {/* Card Thumbnail */}
                  <div className="relative w-16 h-22 flex-shrink-0 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-1">
                    <Image
                      src={item.image_url || '/placeholder-card.svg'}
                      alt={item.name}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-card.svg';
                      }}
                    />
                  </div>

                  {/* Card Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {item.expansion} · #{item.number}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
                          {item.version}
                        </span>
                        <LanguageBadge language={item.language} size="xs" />
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-700/60">
                          👤 Vendedor: {item.seller_name || 'Luca'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Restar"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          className={`p-0.5 ${
                            item.quantity >= item.stock
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title={item.quantity >= item.stock ? 'Stock máximo alcanzado' : 'Sumar'}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-white">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer / Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-800/80 bg-slate-900/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Subtotal ({totalCount} cartas)</span>
                <span className="font-semibold text-slate-200">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-white pt-1 border-t border-slate-800">
                <span>Total Estimado</span>
                <span className="text-blue-400 text-lg font-black">{formatPrice(totalPrice)}</span>
              </div>

              {/* Action Buttons based on Single / Multi Seller */}
              <div className="space-y-2 pt-2">
                {sellerGroups.length === 1 ? (
                  <div className="space-y-1.5">
                    <a
                      href={generateWhatsAppMessageForGroup(sellerGroups[0])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white bg-[#25D366] hover:bg-[#20ba5a] shadow-lg shadow-emerald-950/40 transition-all duration-200 active:scale-[0.98]"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Pedido a {sellerGroups[0].sellerName} por WhatsApp</span>
                    </a>
                    {sellerGroups[0].sellerPhone && (
                      <p className="text-[10px] text-center text-slate-400 font-mono">
                        📱 Se enviará al WhatsApp (+{sellerGroups[0].sellerPhone})
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-[11px] text-blue-200 space-y-0.5">
                      <span className="font-bold text-white block">📦 Cartas de {sellerGroups.length} vendedores distintos</span>
                      <span>Envía el mensaje correspondiente a cada vendedor para coordinar tu compra:</span>
                    </div>
                    {sellerGroups.map((group) => (
                      <div key={group.sellerName} className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">👤 Vendedor: {group.sellerName}</span>
                          <span className="font-black text-blue-400">
                            {formatPrice(group.subtotal)} ({group.count} {group.count === 1 ? 'carta' : 'cartas'})
                          </span>
                        </div>
                        <a
                          href={generateWhatsAppMessageForGroup(group)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs text-white bg-[#25D366] hover:bg-[#20ba5a] shadow-sm transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar a {group.sellerName} {group.sellerPhone ? `(+${group.sellerPhone})` : ''}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={clearCart}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Vaciar carrito
                  </button>
                  <button
                    onClick={closeCart}
                    className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
