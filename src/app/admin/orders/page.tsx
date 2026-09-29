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
  Trash2,
  XCircle,
  AlertTriangle,
  Check,
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
  status: 'solicitado' | 'en_preparacion' | 'preparado' | 'entregado' | 'cancelado';
  created_at: string;
  updated_at: string;
  buyer_user_id?: number;
  wa_notified?: number;
  cancel_reason?: string;
  is_read?: number;
  stock_deducted?: number;
  items: OrderItem[];
}

const CANCEL_REASONS = [
  'Pedido Incorrecto',
  'No cuenta con stock',
  'Publicacion desactualizada',
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<{ [id: number]: boolean }>({});

  // Cancel / Delete Modal state
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('Pedido Incorrecto');
  const [customReason, setCustomReason] = useState('');
  const [deletingLoading, setDeletingLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // mark_read=true when visiting admin orders
      const res = await fetch('/api/orders?mark_read=true');
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

  const handleUpdateStatus = async (
    orderId: number,
    nextStatus: 'solicitado' | 'en_preparacion' | 'preparado' | 'entregado'
  ) => {
    if (nextStatus === 'entregado') {
      const confirmed = window.confirm(
        '¿Confirmas que el pedido fue ENTREGADO al comprador?\n\nAl marcarlo como entregado:\n1. El pedido se cerrará definitivamente.\n2. Se descontará automáticamente el stock comprometido de cada carta en el catálogo.'
      );
      if (!confirmed) return;
    }

    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: nextStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, ...data.order } : ord))
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

  const handleCancelOrDelete = async (permanent: boolean) => {
    if (!deletingOrder) return;
    const finalReason = selectedReason === 'Otro' ? (customReason.trim() || 'Otro') : selectedReason;

    setDeletingLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingOrder.id,
          reason: finalReason,
          permanent,
        }),
      });

      if (res.ok) {
        if (permanent) {
          setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
        } else {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === deletingOrder.id
                ? { ...o, status: 'cancelado', cancel_reason: finalReason }
                : o
            )
          );
        }
        setDeletingOrder(null);
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo procesar la solicitud.');
      }
    } catch (e) {
      console.error(e);
      alert('Error al cancelar el pedido.');
    } finally {
      setDeletingLoading(false);
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
  const countEntregado = orders.filter((o) => o.status === 'entregado').length;
  const countCancelado = orders.filter((o) => o.status === 'cancelado').length;

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
            Administra los pedidos de tus clientes, avanza sus etapas y cierra las entregas.
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

      {/* 4 Steps Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <h3 className="text-sm font-bold text-white mt-3">1. Solicitados</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">En revisión de stock</p>
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
          <h3 className="text-sm font-bold text-white mt-3">2. En preparación</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Stock reconfirmado y cartas empaquetadas</p>
        </div>

        {/* Step 3 Card */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'preparado' ? 'all' : 'preparado')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'preparado'
              ? 'bg-purple-950/70 border-purple-500 shadow-lg shadow-purple-950/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Handshake className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-white">{countPreparado}</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3">3. Preparados</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Listos para entrega / retiro</p>
        </div>

        {/* Closed / Delivered Card */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'entregado' ? 'all' : 'entregado')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'entregado'
              ? 'bg-emerald-950/70 border-emerald-500 shadow-lg shadow-emerald-950/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <span className="text-2xl font-black text-white">{countEntregado}</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3">4. Entregados (Cerrados)</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Stock descontado del catálogo</p>
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
            { id: 'entregado', label: `Entregados (${countEntregado})` },
            { id: 'cancelado', label: `Cancelados (${countCancelado})` },
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
                className={`bg-slate-900/80 border rounded-2xl shadow-xl overflow-hidden transition-all hover:border-slate-700 ${
                  order.status === 'cancelado'
                    ? 'border-rose-900/40 opacity-75'
                    : order.status === 'entregado'
                    ? 'border-emerald-900/40'
                    : 'border-slate-800'
                }`}
              >
                {/* Order Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Order ID, Date, Buyer & Flags */}
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
                      {order.wa_notified === 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>WhatsApp Enviado por Cliente</span>
                        </span>
                      )}
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

                    {order.status === 'cancelado' && (
                      <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>
                          <strong>Pedido Cancelado:</strong> {order.cancel_reason || 'Sin motivo especificado'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle / Right: Status Badge & Step Buttons */}
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
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/50 text-xs font-bold shadow-sm">
                          <Handshake className="w-4 h-4 text-purple-400" />
                          <span>3. Preparado (Listo para entrega)</span>
                        </div>
                      )}
                      {order.status === 'entregado' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-xs font-bold shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>✅ Entregado (Cerrado)</span>
                        </div>
                      )}
                      {order.status === 'cancelado' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/50 text-xs font-bold shadow-sm">
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>❌ Cancelado</span>
                        </div>
                      )}
                    </div>

                    {/* Step Advance / Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
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
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                          <span>Marcar como Preparado</span>
                        </button>
                      )}

                      {order.status === 'preparado' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'entregado')}
                          disabled={isUpdating}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-1.5 disabled:opacity-50 animate-pulse hover:animate-none"
                          title="Cerrar pedido y descontar el stock de las cartas"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>🤝 Marcar Entregado (Cerrar)</span>
                        </button>
                      )}

                      {order.status === 'entregado' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparado')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                          title="Revertir y reponer stock"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reabrir</span>
                        </button>
                      )}

                      {/* Cancel / Delete Button */}
                      {order.status !== 'cancelado' && (
                        <button
                          onClick={() => {
                            setDeletingOrder(order);
                            setSelectedReason('Pedido Incorrecto');
                            setCustomReason('');
                          }}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-rose-900/40 transition-colors"
                          title="Eliminar o cancelar pedido"
                        >
                          <Trash2 className="w-4 h-4" />
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
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Cartas en este paquete ({order.items?.length || 0})
                      </h4>
                      {order.stock_deducted === 1 && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                          Stock descontado del inventario
                        </span>
                      )}
                    </div>

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
                              <LanguageBadge language={it.language} size="xs" />
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs text-slate-400 block">
                              {it.quantity} un. x {formatPrice(it.price)}
                            </span>
                            <span className="font-black text-xs text-white">
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

      {/* Modal para Eliminar / Cancelar Pedido con Motivos */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#0c1322] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Eliminar / Cancelar Pedido #{deletingOrder.order_number}
                </h3>
                <p className="text-xs text-slate-400">
                  Comprador: {deletingOrder.buyer_name} · Total: {formatPrice(deletingOrder.total_price)}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Selecciona el motivo de eliminación / cancelación: *
              </label>

              <div className="space-y-2">
                {CANCEL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedReason === reason
                        ? 'bg-rose-950/40 border-rose-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="w-4 h-4 text-rose-600 bg-slate-950 border-slate-700 accent-rose-600"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleCancelOrDelete(false)}
                disabled={deletingLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all disabled:opacity-50"
              >
                {deletingLoading ? 'Procesando...' : 'Cancelar Pedido (Registrar motivo)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas ELIMINAR PERMANENTEMENTE este pedido de la base de datos?')) {
                    handleCancelOrDelete(true);
                  }
                }}
                disabled={deletingLoading}
                className="w-full py-2 rounded-xl font-semibold text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-all disabled:opacity-50"
              >
                Eliminar definitivamente del sistema
              </button>

              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                disabled={deletingLoading}
                className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
