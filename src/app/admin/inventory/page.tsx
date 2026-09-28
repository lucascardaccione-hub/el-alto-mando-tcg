'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Search,
  Plus,
  Minus,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { CardData } from '@/components/CardItem';
import { LanguageBadge } from '@/components/FlagIcon';

export default function InventoryPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit modal state
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cards');
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Quick adjust stock
  const handleStockChange = async (card: CardData, delta: number) => {
    const newStock = Math.max(0, card.stock + delta);
    if (newStock === card.stock) return;

    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, stock: newStock } : c))
    );

    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!res.ok) {
        showNotification('error', 'Error al actualizar el stock');
        fetchInventory();
      } else {
        showNotification('success', `Stock de "${card.name}" actualizado a ${newStock}`);
      }
    } catch (e) {
      showNotification('error', 'Error de conexión');
      fetchInventory();
    }
  };

  // Delete Card
  const handleDeleteCard = async (card: CardData) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${card.name}" del catálogo?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== card.id));
        showNotification('success', `"${card.name}" eliminada.`);
      } else {
        showNotification('error', 'No se pudo eliminar la carta.');
      }
    } catch (e) {
      showNotification('error', 'Error al eliminar');
    }
  };

  // Save Full Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCard),
      });

      if (res.ok) {
        const data = await res.json();
        setCards((prev) => prev.map((c) => (c.id === editingCard.id ? data.card : c)));
        showNotification('success', `"${editingCard.name}" actualizada con éxito.`);
        setEditingCard(null);
      } else {
        showNotification('error', 'Error al guardar los cambios.');
      }
    } catch (e) {
      showNotification('error', 'Error de conexión al guardar.');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredCards = cards.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.expansion.toLowerCase().includes(term) ||
      c.artist.toLowerCase().includes(term) ||
      c.number.toLowerCase().includes(term) ||
      c.version.toLowerCase().includes(term) ||
      (c.language && c.language.toLowerCase().includes(term))
    );
  });

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Package className="w-7 h-7 text-blue-500" />
            <span>Inventario y Control de Stock</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Modifica stock en tiempo real, actualiza precios y administra las cartas disponibles.
          </p>
        </div>

        <Link
          href="/admin/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Otra Carta</span>
        </Link>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs sm:text-sm animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-700 text-emerald-300'
              : 'bg-rose-950/90 border border-rose-800 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-[#0d1629] p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nombre, colección, versión o artista..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={fetchInventory}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden sm:inline">Refrescar</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#0d1629] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Carta</th>
                <th className="py-3.5 px-3">Colección (EN)</th>
                <th className="py-3.5 px-3">Idioma</th>
                <th className="py-3.5 px-3">Versión</th>
                <th className="py-3.5 px-3">Precio</th>
                <th className="py-3.5 px-3 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    {loading ? 'Cargando inventario...' : 'No se encontraron cartas en el inventario.'}
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Card & Image */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-14 bg-slate-950 rounded overflow-hidden flex-shrink-0 border border-slate-800">
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
                          <p className="font-bold text-white text-sm">{card.name}</p>
                          <p className="text-[11px] text-slate-400">
                            #{card.number} · {card.artist}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Expansion */}
                    <td className="py-3.5 px-3 font-medium text-slate-300">
                      {card.expansion}
                    </td>

                    {/* Language */}
                    <td className="py-3.5 px-3">
                      <LanguageBadge language={card.language} size="xs" />
                    </td>

                    {/* Version */}
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {card.version}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-3 font-extrabold text-white">
                      {formatPrice(card.price)}
                    </td>

                    {/* Stock Quick Adjustment */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStockChange(card, -1)}
                          disabled={card.stock <= 0}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Restar 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span
                          className={`min-w-[42px] text-center font-bold px-2 py-0.5 rounded text-xs ${
                            card.stock > 0
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                          }`}
                        >
                          {card.stock}
                        </span>

                        <button
                          onClick={() => handleStockChange(card, 1)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Sumar 1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingCard({ ...card })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title="Editar detalles"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteCard(card)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Eliminar carta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setEditingCard(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-[#0d1629] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white">Editar Carta #{editingCard.id}</h3>
                <button
                  onClick={() => setEditingCard(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editingCard.name}
                    onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Colección</label>
                    <input
                      type="text"
                      required
                      value={editingCard.expansion}
                      onChange={(e) =>
                        setEditingCard({ ...editingCard, expansion: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Número</label>
                    <input
                      type="text"
                      required
                      value={editingCard.number}
                      onChange={(e) => setEditingCard({ ...editingCard, number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Precio ($ ARS)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingCard.price}
                      onChange={(e) =>
                        setEditingCard({ ...editingCard, price: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingCard.stock}
                      onChange={(e) =>
                        setEditingCard({
                          ...editingCard,
                          stock: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Versión</label>
                    <input
                      type="text"
                      value={editingCard.version}
                      onChange={(e) => setEditingCard({ ...editingCard, version: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Idioma</label>
                    <select
                      value={editingCard.language || 'Inglés'}
                      onChange={(e) => setEditingCard({ ...editingCard, language: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="Inglés">🇺🇸 Inglés</option>
                      <option value="Español">🇪🇸 Español</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Artista</label>
                    <input
                      type="text"
                      value={editingCard.artist}
                      onChange={(e) => setEditingCard({ ...editingCard, artist: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">URL de Imagen</label>
                  <input
                    type="url"
                    value={editingCard.image_url}
                    onChange={(e) =>
                      setEditingCard({ ...editingCard, image_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow"
                  >
                    {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
