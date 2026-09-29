'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  Clock,
  PackageCheck,
  Handshake,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  User,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { LanguageBadge } from './FlagIcon';

interface SellerGroup {
  sellerId?: number;
  sellerName: string;
  sellerPhone: string;
  items: CartItem[];
  subtotal: number;
  count: number;
}

interface CompletedOrderModalProps {
  orderNumber: string;
  sellerName: string;
  buyerName: string;
  subtotal: number;
  onClose: () => void;
}

function OrderSuccessModal({
  orderNumber,
  sellerName,
  buyerName,
  subtotal,
  onClose,
}: CompletedOrderModalProps) {
  const [copied, setCopied] = useState(false);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c1322] border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        {/* Title & Order Number */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60">
            ¡Pedido Solicitado con Éxito!
          </span>
          <h3 className="text-2xl font-black text-white">
            Pedido <span className="text-blue-400">#{orderNumber}</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hemos registrado tu pedido para <strong className="text-white">{sellerName}</strong>.
            Se abrió WhatsApp para que puedas coordinar directamente con el vendedor.
          </p>
        </div>

        {/* 3-Step Visual Progress Stepper */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Proceso de tu pedido (3 simples pasos):
          </h4>

          <div className="space-y-3">
            {/* Step 1: Active */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40">
              <div className="p-2 rounded-lg bg-blue-600 text-white flex-shrink-0 shadow">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-blue-300">
                    1. Solicitado (En Revisión)
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    ACTUAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  El vendedor recibió tu lista y reconfirmará el stock físico.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 opacity-60">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-400 flex-shrink-0">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-400">
                  2. En preparación (Stock Reconfirmado)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cartas separadas y empaquetadas en sleeves/toploaders.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 opacity-60">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-400 flex-shrink-0">
                <Handshake className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-400">
                  3. Preparado (Coordinemos la entrega)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Listo para retiro en punto acordado o envío por correo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy & Actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Código de Pedido</span>
              <span className="text-sm font-mono font-bold text-white">#{orderNumber}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div className="flex gap-2">
            <a
              href={`/pedidos?numero=${orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver seguimiento en vivo</span>
            </a>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 transition-all"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    removeSellerItems,
    updateQuantity,
    clearCart,
    totalCount,
    totalPrice,
  } = useCart();

  // Buyer information persisted in localStorage
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [submittingSeller, setSubmittingSeller] = useState<string | null>(null);

  // Success modal state
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    sellerName: string;
    buyerName: string;
    subtotal: number;
  } | null>(null);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem('eam_buyer_name');
      const savedPhone = localStorage.getItem('eam_buyer_phone');
      if (savedName) setBuyerName(savedName);
      if (savedPhone) setBuyerPhone(savedPhone);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveBuyerData = (name: string, phone: string) => {
    setBuyerName(name);
    setBuyerPhone(phone);
    try {
      localStorage.setItem('eam_buyer_name', name);
      localStorage.setItem('eam_buyer_phone', phone);
    } catch (e) {
      console.error(e);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Group items by seller (MercadoLibre style packages)
  const sellerGroups: SellerGroup[] = useMemo(() => {
    const groups: { [key: string]: SellerGroup } = {};
    items.forEach((item) => {
      const sellerKey = (item.seller_name || 'Luca').trim();
      if (!groups[sellerKey]) {
        groups[sellerKey] = {
          sellerId: item.seller_id,
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

  // Handle Order confirmation for a specific seller group
  const handleConfirmOrderForGroup = async (group: SellerGroup) => {
    const finalBuyerName = buyerName.trim() || 'Cliente';
    setSubmittingSeller(group.sellerName);

    try {
      // 1. Create order in Turso DB
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: group.sellerId,
          seller_name: group.sellerName,
          seller_phone: group.sellerPhone,
          buyer_name: finalBuyerName,
          buyer_phone: buyerPhone.trim(),
          items: group.items,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      const orderNumber = data.orderNumber;

      // 2. Build WhatsApp message with order number and 3-step information
      let text = `🛒 *PEDIDO #${orderNumber} - El Alto Mando TCG*\n`;
      text += `👤 *Vendedor:* ${group.sellerName}\n`;
      text += `🙋‍♂️ *Comprador:* ${finalBuyerName}\n`;
      text += `📊 *Estado Inicial:* 🕒 Solicitado (En Revisión)\n\n`;
      text += `📦 *Detalle del paquete (${group.count} cartas):*\n`;

      group.items.forEach((it, idx) => {
        const foilTag = it.is_foil === 1 || it.version?.toLowerCase().includes('foil') ? ' [✨ FOIL]' : '';
        text += `${idx + 1}. *${it.name}* (${it.expansion} #${it.number})\n`;
        text += `   • Versión: ${it.version}${foilTag} | Idioma: ${it.language || 'Inglés'}\n`;
        text += `   • Cantidad: ${it.quantity} un. x ${formatPrice(it.price)} = ${formatPrice(it.price * it.quantity)}\n`;
      });

      text += `\n💰 *TOTAL DEL PAQUETE:* ${formatPrice(group.subtotal)}\n\n`;
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://elaltomandotcg.com';
      text += `🔗 *Seguimiento en vivo del pedido:* ${origin}/pedidos?numero=${orderNumber}\n\n`;
      text += `¡Hola ${group.sellerName}! Acabo de generar mi pedido *#${orderNumber}* en la plataforma.\n¿Me confirmas disponibilidad para pasar a *📦 En preparación* y coordinar la entrega? Muchas gracias!`;

      const cleanPhone = (group.sellerPhone || '').replace(/[^\d]/g, '');
      const waUrl = `https://wa.me/${cleanPhone ? cleanPhone : ''}?text=${encodeURIComponent(text)}`;

      // 3. Open WhatsApp in new tab
      window.open(waUrl, '_blank');

      // 4. Remove this seller's items from the cart (MercadoLibre style)
      removeSellerItems(group.sellerName);

      // 5. Open Success & 3-Step Tracker modal
      setCompletedOrder({
        orderNumber,
        sellerName: group.sellerName,
        buyerName: finalBuyerName,
        subtotal: group.subtotal,
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al generar el pedido.');
    } finally {
      setSubmittingSeller(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {completedOrder && (
        <OrderSuccessModal
          orderNumber={completedOrder.orderNumber}
          sellerName={completedOrder.sellerName}
          buyerName={completedOrder.buyerName}
          subtotal={completedOrder.subtotal}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          onClick={closeCart}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
          <div className="w-screen max-w-lg bg-[#0b1220] border-l border-slate-800 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                    Carrito de Compras
                  </h2>
                  <p className="text-xs text-slate-400">
                    {totalCount} {totalCount === 1 ? 'carta' : 'cartas'} en total · {sellerGroups.length} {sellerGroups.length === 1 ? 'paquete' : 'paquetes'}
                  </p>
                </div>
              </div>

              <button
                onClick={closeCart}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buyer Contact Form Banner */}
            {items.length > 0 && (
              <div className="bg-slate-900/90 border-b border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Datos para tu pedido
                  </span>
                  <span className="text-[10px] text-slate-500">Se guardan automáticamente</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tu Nombre / Apodo"
                    value={buyerName}
                    onChange={(e) => saveBuyerData(e.target.value, buyerPhone)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Tu WhatsApp (opcional)"
                    value={buyerPhone}
                    onChange={(e) => saveBuyerData(buyerName, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* MercadoLibre-style Packages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <ShoppingBag className="w-8 h-8 opacity-40" />
                  </div>
                  <h3 className="font-semibold text-slate-300">Tu carrito está vacío</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Explora el catálogo oficial de cartas y añade las que necesites para armar tus paquetes.
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                sellerGroups.map((group, groupIdx) => {
                  const isSubmitting = submittingSeller === group.sellerName;

                  return (
                    <div
                      key={group.sellerName}
                      className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden"
                    >
                      {/* Package Header (MercadoLibre style) */}
                      <div className="p-3.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                            {groupIdx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">
                                Paquete de: <strong className="text-blue-300">{group.sellerName}</strong>
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                Verificado
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {group.count} {group.count === 1 ? 'carta' : 'cartas'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Subtotal</span>
                          <span className="text-xs font-black text-white">
                            {formatPrice(group.subtotal)}
                          </span>
                        </div>
                      </div>

                      {/* Items in this package */}
                      <div className="p-3.5 space-y-3">
                        {group.items.map((item) => {
                          const isFoil = item.is_foil === 1 || item.version?.toLowerCase().includes('foil');

                          return (
                            <div
                              key={item.id}
                              className="flex gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700/60 transition-colors"
                            >
                              {/* Card Image */}
                              <div className="relative w-14 h-20 flex-shrink-0 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-0.5">
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

                              {/* Card Info */}
                              <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                  <div className="flex items-start justify-between gap-1">
                                    <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                                      {item.name}
                                    </h4>
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                      title="Quitar carta"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <p className="text-[11px] text-slate-400 truncate">
                                    {item.expansion} · #{item.number}
                                  </p>

                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
                                      {item.version}
                                    </span>
                                    {isFoil && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40">
                                        ✨ FOIL
                                      </span>
                                    )}
                                    <LanguageBadge language={item.language} size="xs" />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1.5">
                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-2 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                                    <button
                                      onClick={() => updateQuantity(item.id, -1)}
                                      className="text-slate-400 hover:text-white p-0.5"
                                      title="Restar"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-bold text-white px-1">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(item.id, 1)}
                                      disabled={item.quantity >= item.stock}
                                      className={`p-0.5 ${
                                        item.quantity >= item.stock
                                          ? 'text-slate-600 cursor-not-allowed'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                      title={item.quantity >= item.stock ? 'Stock máximo' : 'Sumar'}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Subtotal */}
                                  <div className="text-right">
                                    <span className="font-extrabold text-xs text-white">
                                      {formatPrice(item.price * item.quantity)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Package Order Action */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <button
                            onClick={() => handleConfirmOrderForGroup(group)}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs text-white bg-[#25D366] hover:bg-[#20ba5a] shadow-lg shadow-emerald-950/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {isSubmitting
                                ? 'Generando pedido...'
                                : `Confirmar Pedido #${group.sellerName} (${formatPrice(group.subtotal)})`}
                            </span>
                          </button>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                            <span>🕒 Paso 1: Solicitado (En Revisión)</span>
                            {group.sellerPhone ? (
                              <span className="font-mono text-slate-400">+{group.sellerPhone}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Global Footer */}
            {items.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/90 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Carrito ({totalCount} cartas)</span>
                  <span className="font-semibold text-slate-200">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-white pt-1 border-t border-slate-800">
                  <span>Total Global</span>
                  <span className="text-blue-400 text-lg font-black">{formatPrice(totalPrice)}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={clearCart}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Vaciar todo el carrito
                  </button>
                  <button
                    onClick={closeCart}
                    className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
                  >
                    Seguir explorando cartas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

