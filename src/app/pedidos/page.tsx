'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Search,
  Clock,
  PackageCheck,
  Handshake,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { LanguageBadge } from '@/components/FlagIcon';

interface OrderItem {
  id: number;
  name: string;
  expansion: string;
  number: string;
  version: string;
  is_foil: number;
  language: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface OrderData {
  id: number;
  order_number: string;
  seller_name: string;
  seller_phone: string;
  buyer_name: string;
  buyer_phone: string;
  total_price: number;
  total_items: number;
  status: 'solicitado' | 'en_preparacion' | 'preparado' | 'entregado' | 'cancelado';
  cancel_reason?: string;
  wa_notified?: number;
  created_at: string;
  updated_at: string;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialNum = searchParams.get('numero') || searchParams.get('order_number') || '';

  const [inputNum, setInputNum] = useState(initialNum);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchOrder = async (numToFetch: string) => {
    if (!numToFetch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const cleanNum = numToFetch.trim().toUpperCase().replace('#', '');
      const res = await fetch(`/api/orders?order_number=${encodeURIComponent(cleanNum)}`);
      if (!res.ok) {
        throw new Error('No encontramos ningún pedido con ese número. Verifica que esté bien escrito.');
      }
      const data = await res.json();
      setOrder(data.order);
      setItems(data.items || []);
    } catch (err: any) {
      setOrder(null);
      setItems([]);
      setError(err.message || 'Error al buscar el pedido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialNum) {
      fetchOrder(initialNum);
    }
  }, [initialNum]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(inputNum);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopy = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'solicitado':
        return 1;
      case 'en_preparacion':
        return 2;
      case 'preparado':
        return 3;
      case 'entregado':
        return 4;
      case 'cancelado':
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la Tienda</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Seguimiento de tu Pedido
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Ingresa tu número de pedido (ej: <strong className="text-blue-400 font-mono">EAM-12345</strong>) para consultar su estado en tiempo real.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="EAM-XXXXX"
              value={inputNum}
              onChange={(e) => setInputNum(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white uppercase placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Consultar'}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-center text-xs text-rose-300 max-w-md mx-auto">
          {error}
        </div>
      )}

      {/* Order Results */}
      {order && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Main Card */}
          <div className="bg-[#0b1220] border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black font-mono text-blue-400">
                    #{order.order_number}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Copiar código"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-xs text-slate-400">
                    · {new Date(order.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Comprador: <strong className="text-white">{order.buyer_name}</strong></span>
                  <span>·</span>
                  <span>Vendedor: <strong className="text-blue-300">{order.seller_name}</strong></span>
                  {order.wa_notified === 1 && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      ✓ WhatsApp informado
                    </span>
                  )}
                </div>
              </div>

              {order.seller_phone && (
                <a
                  href={`https://wa.me/${order.seller_phone.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] shadow-md transition-all self-start sm:self-auto"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contactar a {order.seller_name}</span>
                </a>
              )}
            </div>

            {/* Cancelled Banner if applicable */}
            {order.status === 'cancelado' && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-left space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-extrabold text-sm">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Pedido Cancelado por el Vendedor</span>
                </div>
                <p className="text-xs text-rose-200">
                  <strong>Motivo:</strong> {order.cancel_reason || 'No especificado'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Si deseas consultar detalles adicionales o coordinar una alternativa, puedes contactar a {order.seller_name} por WhatsApp.
                </p>
              </div>
            )}

            {/* Delivered Celebratory Banner if applicable */}
            {order.status === 'entregado' && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-left space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>¡Pedido Entregado y Cerrado con Éxito!</span>
                </div>
                <p className="text-xs text-emerald-200">
                  Este pedido fue entregado y completado satisfactoriamente. ¡Muchas gracias por tu compra en El Alto Mando TCG!
                </p>
              </div>
            )}

            {/* 3 Steps Progress Bar Visualizer (if not cancelled) */}
            {order.status !== 'cancelado' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Estado del Pedido (Proceso de 3 pasos)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Step 1 */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      currentStep >= 1
                        ? currentStep === 1
                          ? 'bg-blue-950/70 border-blue-500 shadow-md shadow-blue-950/50'
                          : 'bg-slate-900/60 border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`p-2 rounded-xl text-xs ${
                        currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Clock className="w-4 h-4" />
                      </span>
                      {currentStep === 1 && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40">
                          Paso Actual
                        </span>
                      )}
                      {currentStep > 1 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h4 className="text-xs font-extrabold text-white">1. Solicitado (En Revisión)</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tu pedido fue enviado al vendedor. Esperando reconfirmación de stock.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      currentStep >= 2
                        ? currentStep === 2
                          ? 'bg-amber-950/70 border-amber-500 shadow-md shadow-amber-950/50'
                          : 'bg-slate-900/60 border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`p-2 rounded-xl text-xs ${
                        currentStep === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <PackageCheck className="w-4 h-4" />
                      </span>
                      {currentStep === 2 && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                          Paso Actual
                        </span>
                      )}
                      {currentStep > 2 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h4 className="text-xs font-extrabold text-white">2. En preparación (Stock Reconfirmado)</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Stock reconfirmado por el vendedor. Cartas protegidas y separadas.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      currentStep >= 3
                        ? currentStep === 3
                          ? 'bg-purple-950/70 border-purple-500 shadow-md shadow-purple-950/50'
                          : 'bg-slate-900/60 border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`p-2 rounded-xl text-xs ${
                        currentStep === 3 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Handshake className="w-4 h-4" />
                      </span>
                      {currentStep === 3 && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40">
                          ¡Listo!
                        </span>
                      )}
                      {currentStep > 3 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h4 className="text-xs font-extrabold text-white">3. Preparado (Coordinemos la entrega)</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      ¡Tu paquete está listo! Coordinando punto de encuentro o despacho.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cartas solicitadas ({items.length})
              </h3>

              <div className="space-y-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-15 flex-shrink-0 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-0.5">
                        <Image
                          src={it.image_url || '/placeholder-card.svg'}
                          alt={it.name}
                          width={44}
                          height={60}
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">{it.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {it.expansion} · #{it.number}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
                            {it.version}
                          </span>
                          {it.is_foil === 1 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40">
                              ✨ FOIL
                            </span>
                          )}
                          <LanguageBadge language={it.language} size="xs" />
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-slate-400 block">
                        {it.quantity} un. x {formatPrice(it.price)}
                      </span>
                      <span className="font-black text-sm text-white">
                        {formatPrice(it.price * it.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Footer */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                <span>Total del pedido ({order.total_items} cartas)</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-blue-400">
                  {formatPrice(order.total_price)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PedidosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={
          <div className="text-center py-20 text-slate-400 text-xs">
            Cargando seguimiento...
          </div>
        }>
          <TrackingContent />
        </Suspense>
      </main>
    </div>
  );
}
