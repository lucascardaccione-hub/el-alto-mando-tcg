'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Layers,
  Sparkles,
  DollarSign,
  AlertTriangle,
  PlusCircle,
  Package,
  Users,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { CardData } from '@/components/CardItem';

export default function AdminDashboardPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/cards');
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || []);
        }
      } catch (e) {
        console.error('Error fetching cards:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCards = cards.length;
  const totalStock = cards.reduce((acc, c) => acc + (c.stock || 0), 0);
  const totalInventoryValue = cards.reduce((acc, c) => acc + (c.price * (c.stock || 0)), 0);
  const outOfStockCount = cards.filter((c) => c.stock === 0).length;
  const lowStockCount = cards.filter((c) => c.stock > 0 && c.stock <= 2).length;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Panel de Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Resumen global del stock de cartas y catálogo de <strong className="text-slate-300">El Alto Mando TCG</strong>.
          </p>
        </div>

        <Link
          href="/admin/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Cargar Nueva Carta</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cards */}
        <div className="p-5 rounded-2xl bg-[#0d1629] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cartas Únicas</span>
            <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalCards}</div>
          <p className="text-[11px] text-slate-500">Cartas registradas en catálogo</p>
        </div>

        {/* Total Units Stock */}
        <div className="p-5 rounded-2xl bg-[#0d1629] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Stock Total (Unidades)</span>
            <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400">{totalStock}</div>
          <p className="text-[11px] text-slate-500">Copias físicas en stock</p>
        </div>

        {/* Estimated Inventory Value */}
        <div className="p-5 rounded-2xl bg-[#0d1629] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Valor de Inventario</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 truncate">
            {formatPrice(totalInventoryValue)}
          </div>
          <p className="text-[11px] text-slate-500">Calculado a precio actual</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-[#0d1629] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Stock Bajo / Agotadas</span>
            <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">
            {outOfStockCount} <span className="text-xs text-slate-500 font-normal">agotadas</span> / {lowStockCount} <span className="text-xs text-slate-500 font-normal">bajas</span>
          </div>
          <p className="text-[11px] text-slate-500">Requieren reposición</p>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/new"
          className="group p-5 rounded-2xl bg-gradient-to-br from-blue-950/30 to-[#0d1629] border border-blue-900/40 hover:border-blue-500/60 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
              Carga Asistida de Cartas
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Busca por nombre en la base de datos oficial y carga el stock con foto HD en segundos.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/inventory"
          className="group p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0d1629] border border-slate-800 hover:border-amber-500/50 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
              Gestionar Inventario
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Modifica cantidades de stock, precios y versiones con botones rápidos (+ / -).
            </p>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0d1629] border border-slate-800 hover:border-purple-500/50 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">
              Usuarios Habilitados
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Controla quiénes de tu equipo tienen permiso para acceder y subir cartas al sistema.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Inventory Preview */}
      <div className="bg-[#0d1629] border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Últimas Cartas en Inventario</span>
          </h2>
          <Link
            href="/admin/inventory"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            Ver inventario completo →
          </Link>
        </div>

        {cards.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No hay cartas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Carta</th>
                  <th className="pb-3">Expansión</th>
                  <th className="pb-3">Versión</th>
                  <th className="pb-3">Artista</th>
                  <th className="pb-3">Precio</th>
                  <th className="pb-3">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {cards.slice(0, 6).map((card) => (
                  <tr key={card.id} className="hover:bg-slate-900/50">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-11 bg-slate-950 rounded flex-shrink-0 overflow-hidden">
                          <Image
                            src={card.image_url || '/placeholder-card.svg'}
                            alt={card.name}
                            fill
                            className="object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-card.svg';
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-white">{card.name}</p>
                          <p className="text-[10px] text-slate-500">#{card.number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-medium">{card.expansion}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {card.version}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{card.artist}</td>
                    <td className="py-3 font-bold text-white">{formatPrice(card.price)}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          card.stock > 0
                            ? 'bg-emerald-950/80 text-emerald-300'
                            : 'bg-rose-950/80 text-rose-300'
                        }`}
                      >
                        {card.stock} un.
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
