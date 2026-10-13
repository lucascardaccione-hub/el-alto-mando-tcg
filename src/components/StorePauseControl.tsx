'use client';

import React, { useEffect, useState } from 'react';
import { PauseCircle, PlayCircle, Store, Loader2 } from 'lucide-react';
import { useStoreStatus, broadcastStoreStatus } from '@/hooks/useStoreStatus';

const PRESET_MESSAGES = [
  'La tienda se encuentra en pausa momentáneamente. Volvemos pronto.',
  'Estamos actualizando el stock. En breve vas a poder volver a hacer pedidos.',
  'Pausa por vacaciones. Podés seguir viendo el catálogo y armar tu carrito.',
];

export default function StorePauseControl() {
  const { paused, message, updated_at, updated_by, loading } = useStoreStatus();
  const [draftMessage, setDraftMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!loading) setDraftMessage(paused ? message : '');
  }, [loading, paused, message]);

  const save = async (nextPaused: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/store-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: nextPaused, message: draftMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar');
      // Re-read via GET so the default message gets applied consistently
      const fresh = await fetch('/api/store-status', { cache: 'no-store' }).then((r) => r.json());
      broadcastStoreStatus({
        paused: !!fresh.paused,
        message: fresh.message || '',
        updated_at: fresh.updated_at || null,
        updated_by: fresh.updated_by || null,
      });
      setConfirming(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-colors ${
        paused ? 'bg-amber-950/40 border-amber-500/50' : 'bg-[#0d1629] border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              paused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
              Estado de la Tienda
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    paused
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {paused ? 'En pausa' : 'Abierta'}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              {paused
                ? 'Los clientes pueden ver el catálogo, pero no pueden generar pedidos nuevos. Los pedidos existentes siguen su curso normal.'
                : 'La tienda está recibiendo pedidos normalmente.'}
            </p>
            {updated_at && (
              <p className="text-[11px] text-slate-500 mt-1">
                Último cambio: {new Date(updated_at).toLocaleString('es-AR')}
                {updated_by ? ` por ${updated_by}` : ''}
              </p>
            )}
          </div>
        </div>

        {paused ? (
          <button
            onClick={() => save(false)}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            <span>Reanudar Tienda</span>
          </button>
        ) : !confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-amber-100 bg-amber-600/90 hover:bg-amber-500 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
          >
            <PauseCircle className="w-5 h-5" />
            <span>Pausar Tienda</span>
          </button>
        ) : null}
      </div>

      {/* Message editor: shown while confirming a pause, or while paused (to edit the text) */}
      {(confirming || paused) && (
        <div className="space-y-2.5 pt-3 border-t border-white/10">
          <label className="text-xs font-bold text-slate-300 block" htmlFor="pause-message">
            Mensaje para los clientes (opcional)
          </label>
          <textarea
            id="pause-message"
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value.slice(0, 300))}
            rows={2}
            placeholder="Ej: Pausa por vacaciones, volvemos el lunes."
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESET_MESSAGES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDraftMessage(m)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-amber-500/60 hover:text-white transition-colors text-left"
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500">{draftMessage.length}/300</span>
            <div className="flex gap-2">
              {confirming && !paused && (
                <>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => save(true)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    Confirmar pausa
                  </button>
                </>
              )}
              {paused && (
                <button
                  onClick={() => save(true)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50"
                >
                  Guardar mensaje
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </section>
  );
}
