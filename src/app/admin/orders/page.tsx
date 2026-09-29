'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Clock,
  PackageCheck,
  Handshake,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Phone,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react';
import { LanguageBadge } from '@/components/FlagIcon';

interface OrderItem {
  id: number;
  order_id: number;
  card_id: number;
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

interface Order {
  id: number;
  order_number: string;
  seller_id: number | null;
  seller_name: string;
  seller_phone: string;
  buyer_name: string;
  buyer_phone: string;
  total_price: number;
  total_items: number;
  status: 'solicitado' | 'en_preparacion' | 'preparado';
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<{ [id: number]: boolean }>({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleUpdateStatus = async (orderId: number, nextStatus: 'solicitado' | 'en_preparacion' | 'preparado') => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: nextStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, status: nextStatus } : ord))
        );
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo actualizar el estado.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al actualizar el pedido');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.order_number.toLowerCase().includes(q);
      const matchBuyer = order.buyer_name.toLowerCase().includes(q);
      const matchSeller = order.seller_name.toLowerCase().includes(q);
      const matchCard = order.items?.some((it) => it.name.toLowerCase().includes(q));
      if (!matchNum && !matchBuyer && !matchSeller && !matchCard) return false;
    }
    return true;
  });

  const countSolicitado = orders.filter((o) => o.status === 'solicitado').length;
  const countPreparacion = orders.filter((o) => o.status === 'en_preparacion').length;
  const countPreparado = orders.filter((o) => o.status === 'preparado').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-blue-400" />
            Gestión de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Administra los pedidos de tus clientes y avanza sus 3 sencillos pasos.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 3 Steps Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Step 1 Card */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'solicitado' ? 'all' : 'solicitado')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'solicitado'
              ? 'bg-blue-950/70 border-blue-500 shadow-lg shadow-blue-950/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Clock className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-white">{countSolicitado}</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3">1. Solicitado (En Revisión)</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Pedidos recién recibidos por WhatsApp</p>
        </div>

        {/* Step 2 Card */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'en_preparacion' ? 'all' : 'en_preparacion')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'en_preparacion'
              ? 'bg-amber-950/70 border-amber-500 shadow-lg shadow-amber-950/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <PackageCheck className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-white">{countPreparacion}</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3">2. En preparación (Stock Reconfirmado)</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Stock verificado y cartas empaquetadas</p>
        </div>

        {/* Step 3 Card */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'preparado' ? 'all' : 'preparado')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'preparado'
              ? 'bg-emerald-950/70 border-emerald-500 shadow-lg shadow-emerald-950/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Handshake className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-white">{countPreparado}</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3">3. Preparado (Coordinemos la entrega)</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Listo para retiro presencial o envío</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Todos (${orders.length})` },
            { id: 'solicitado', label: `Solicitados (${countSolicitado})` },
            { id: 'en_preparacion', label: `En preparación (${countPreparacion})` },
            { id: 'preparado', label: `Preparados (${countPreparado})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por #pedido, cliente, carta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Cargando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
          <h3 className="font-bold text-base text-slate-300">No hay pedidos en esta sección</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus !== 'all'
              ? 'No hay pedidos con el estado seleccionado.'
              : 'Cuando los clientes confirmen sus paquetes en el carrito, aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:border-slate-700"
              >
                {/* Order Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Order ID, Date & Buyer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base sm:text-lg font-black font-mono text-blue-400">
                        #{order.order_number}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-950 text-slate-300 border border-slate-700/60">
                        👤 Vendedor: {order.seller_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Comprador: <strong className="text-white">{order.buyer_name}</strong></span>
                      </div>

                      {order.buyer_phone && (
                        <a
                          href={`https://wa.me/${order.buyer_phone.replace(/[^\d]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp (+{order.buyer_phone})</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Middle / Right: 3-Step Controls & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Status Badge */}
                    <div>
                      {order.status === 'solicitado' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 text-blue-300 border border-blue-500/50 text-xs font-bold shadow-sm">
                          <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                          <span>1. Solicitado (En Revisión)</span>
                        </div>
                      )}
                      {order.status === 'en_preparacion' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/50 text-xs font-bold shadow-sm">
                          <PackageCheck className="w-4 h-4 text-amber-400" />
                          <span>2. En preparación (Stock Reconfirmado)</span>
                        </div>
                      )}
                      {order.status === 'preparado' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-xs font-bold shadow-sm">
                          <Handshake className="w-4 h-4 text-emerald-400" />
                          <span>3. Preparado (Coordinemos la entrega)</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Step Advance Button */}
                    <div className="flex items-center gap-2">
                      {order.status === 'solicitado' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Pasar a Preparación</span>
                        </button>
                      )}
                      {order.status === 'en_preparacion' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparado')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                          <span>Marcar como Preparado</span>
                        </button>
                      )}
                      {order.status === 'preparado' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'solicitado')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                          title="Reiniciar a Solicitado"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reabrir</span>
                        </button>
                      )}

                      {/* Total and Expand toggle */}
                      <div className="text-right pl-3 border-l border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                        <span className="text-sm font-black text-white">
                          {formatPrice(order.total_price)}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                        title={isExpanded ? 'Ocultar cartas' : 'Ver cartas'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Items List */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-950/70 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Cartas en este paquete ({order.items?.length || 0})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {order.items?.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80"
                        >
                          <div className="relative w-12 h-16 flex-shrink-0 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-0.5">
                            <Image
                              src={it.image_url || '/placeholder-card.svg'}
                              alt={it.name}
                              fill
                              className="object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-card.svg';
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-white truncate">{it.name}</h5>
                            <p className="text-[11px] text-slate-400 truncate">
                              {it.expansion} · #{it.number}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
                                {it.version}
                              </span>
                              {it.is_foil === 1 && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40">
                                  ✨ FOIL
                                </span>
                              )}
                              {it.is_league === 1 && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-red-950/80 text-red-200 border border-red-700/60 flex items-center gap-1">
                                  <img src="/prize-pack-stamp.png" alt="Prize Pack" className="w-3 h-2.5 object-contain" />
                                  <span>Liga</span>
                                </span>
                              )}
                              <LanguageBadge language={it.language} size="xs" />
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-bold text-slate-300 block">x{it.quantity}</span>
                            <span className="text-xs font-black text-white">
                              {formatPrice(it.price * it.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
