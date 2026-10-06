'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Save,
  Loader2,
  Sparkles,
  AlertCircle,
  Check,
  ImageIcon,
  Layers,
  Tag,
  DollarSign,
  Package,
} from 'lucide-react';
import { CardData } from './CardItem';

interface EditCardModalProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedCard: CardData) => void;
}

export default function EditCardModal({
  card,
  isOpen,
  onClose,
  onSaved,
}: EditCardModalProps) {
  const [formData, setFormData] = useState<Partial<CardData>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (card) {
      setFormData({
        name: card.name || '',
        expansion: card.expansion || '',
        number: card.number || '',
        version: card.version || 'Común',
        language: card.language || 'Inglés',
        artist: card.artist || '',
        rarity: card.rarity || '',
        category: card.category || 'Pokemon',
        trainer_type: card.trainer_type || '',
        price: card.price ?? 0,
        stock: card.stock ?? 1,
        is_foil: card.is_foil ? 1 : 0,
        is_league: card.is_league ? 1 : 0,
        notes: card.notes || '',
        image_url: card.image_url || '',
      });
      setError(null);
      setSuccess(false);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;

    if (!formData.name?.trim() || !formData.expansion?.trim() || !formData.number?.trim()) {
      setError('El nombre, colección y número son obligatorios.');
      return;
    }

    if ((formData.price ?? 0) < 0) {
      setError('El precio debe ser un número positivo.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Math.max(0, parseInt(String(formData.stock), 10) || 0),
          is_foil: formData.is_foil ? 1 : 0,
          is_league: formData.is_league ? 1 : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar la publicación');
      }

      setSuccess(true);
      setTimeout(() => {
        onSaved(data.card);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#0c1424] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-white">Editar Publicación</h3>
                <p className="text-xs text-slate-400">
                  Modifica los datos y detalles de tu carta publicada en la tienda
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>¡Publicación guardada exitosamente!</span>
              </div>
            )}

            {/* Basic Info: Name, Expansion, Number */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Carta *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Charizard ex, Iono, Ultra Ball"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Colección / Expansión *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.expansion || ''}
                    onChange={(e) => setFormData({ ...formData, expansion: e.target.value })}
                    placeholder="Ej: Obsidian Flames, Paldean Fates"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Número de Carta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.number || ''}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="Ej: 125, 234/193"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Precio ($ ARS) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price ?? ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-base font-black text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Stock Disponible *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock ?? ''}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-base font-black text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category & Trainer Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Categoría
                </label>
                <select
                  value={formData.category || 'Pokemon'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Pokemon">Pokémon</option>
                  <option value="Trainer">Entrenador (Trainer)</option>
                  <option value="Energy">Energía</option>
                </select>
              </div>

              {formData.category === 'Trainer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subtipo de Entrenador
                  </label>
                  <select
                    value={formData.trainer_type || ''}
                    onChange={(e) => setFormData({ ...formData, trainer_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seleccionar subtipo...</option>
                    <option value="Supporter">Partidario (Supporter)</option>
                    <option value="Item">Objeto (Item)</option>
                    <option value="Tool">Herramienta (Tool)</option>
                    <option value="Stadium">Estadio (Stadium)</option>
                    <option value="Special">Especial</option>
                  </select>
                </div>
              )}
            </div>

            {/* Version & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Versión / Acabado
                </label>
                <input
                  type="text"
                  value={formData.version || ''}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="Ej: Común, Holo, Full Art, SIR"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Idioma
                </label>
                <select
                  value={formData.language || 'Inglés'}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Inglés">🇺🇸 Inglés</option>
                  <option value="Español">🇪🇸 Español</option>
                  <option value="Japonés">🇯🇵 Japonés</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Rareza
                </label>
                <input
                  type="text"
                  value={formData.rarity || ''}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                  placeholder="Ej: Rare Holo, Ultra Rare"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Checkboxes: Foil & Prize Pack */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(formData.is_foil)}
                  onChange={(e) => setFormData({ ...formData, is_foil: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-300 block">✨ Acabado Foil / Holo</span>
                  <span className="text-slate-400 text-[11px]">Aplica brillo holográfico al mostrar</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-red-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(formData.is_league)}
                  onChange={(e) => setFormData({ ...formData, is_league: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-red-500 focus:ring-red-400 bg-slate-950 border-slate-700"
                />
                <div className="text-xs">
                  <span className="font-bold text-red-300 block">🏆 Carta Oficial de Liga (Prize Pack)</span>
                  <span className="text-slate-400 text-[11px]">Muestra el sello oficial de Play! Pokémon</span>
                </div>
              </label>
            </div>

            {/* Notes / Condition */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Estado / Notas de la Carta
              </label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ej: Near Mint, guardada en folio protector desde la apertura del sobre."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Image URL & Preview */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                URL de la Imagen
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="url"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.pokemontcg.io/..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                {formData.image_url && (
                  <div className="w-12 h-16 rounded-lg bg-slate-950 border border-slate-700 overflow-hidden relative shrink-0">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-card.svg';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
