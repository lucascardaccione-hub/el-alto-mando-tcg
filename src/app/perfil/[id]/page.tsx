'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Layers,
  Phone,
  MessageCircle,
  Copy,
  Sparkles,
  ArrowLeft,
  Loader2,
  Calendar,
  ExternalLink,
  Award,
} from 'lucide-react';
import { getDefaultAvatar } from '@/lib/avatars';
import { getRoleBadge } from '@/lib/roles';
import { RewardsOverview } from '@/components/RewardsOverview';
import { TrainerCard } from '@/components/TrainerCard';

interface PublicUserProfile {
  id: number;
  username: string;
  role: string;
  avatar_url?: string;
  phone?: string;
  created_at?: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [rewardsData, setRewardsData] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Usuario no encontrado');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setDecks(data.decks || []);
      })
      .catch((err) => {
        setError(err.message || 'No se pudo cargar el perfil');
      })
      .finally(() => {
        setLoading(false);
      });

    fetch(`/api/rewards?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.levelInfo) setRewardsData(d);
      })
      .catch(() => {});
  }, [userId]);

  const handleCloneDeck = async (deckId: number) => {
    setCloningId(deckId);
    try {
      const res = await fetch(`/api/decks/${deckId}/clone`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          alert('Debes iniciar sesión para copiar este mazo.');
          router.push('/login');
          return;
        }
        alert(data.error || 'Error al copiar el mazo');
        return;
      }
      router.push(`/deck-builder/${data.deckId}`);
    } catch {
      alert('Error de conexión al copiar el mazo');
    } finally {
      setCloningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Cargando perfil de usuario...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Usuario no encontrado</h2>
        <p className="text-xs text-slate-400">El perfil solicitado no existe o no se encuentra activo.</p>
        <Link
          href="/decks"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mazos</span>
        </Link>
      </div>
    );
  }

  const roleInfo = getRoleBadge(user);
  const avatarUrl = user.avatar_url || getDefaultAvatar(user.username);
  const memberDate = user.created_at ? new Date(user.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' }) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Navigation */}
      <div>
        <Link
          href="/decks"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Comunidad</span>
        </Link>
      </div>

      {/* Ficha de Entrenador Oficial */}
      <TrainerCard
        username={user.username}
        avatarUrl={avatarUrl}
        roleInfo={roleInfo}
        isVerified={user.role === 'admin' || user.username?.toLowerCase() === 'luca'}
        memberDate={memberDate}
        phone={user.phone}
        publicDecksCount={decks.length}
        levelInfo={rewardsData?.levelInfo}
      >
        {user.phone && (
          <a
            href={`https://wa.me/${user.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${user.username}, te escribo desde El Alto Mando TCG`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50 transition-all hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contactar por WhatsApp</span>
          </a>
        )}
      </TrainerCard>

      {/* Rewards, Medallas y Nivel de Entrenador */}
      {rewardsData?.levelInfo && (
        <div className="space-y-4">
          <RewardsOverview
            levelInfo={rewardsData.levelInfo}
            stats={rewardsData.stats}
            regions={rewardsData.regions}
          />
        </div>
      )}

      {/* Public Decks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>Mazos Públicos de {user.username} ({decks.length})</span>
          </h2>
        </div>

        {decks.length === 0 ? (
          <div className="text-center py-12 bg-[#0b1220]/60 border border-slate-800 rounded-3xl p-6 space-y-2">
            <p className="text-xs text-slate-400">Este usuario aún no ha publicado ningún mazo en la comunidad.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="bg-[#0b1220]/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between shadow-xl transition-all hover:-translate-y-1 space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  {deck.cover_card_image ? (
                    <img
                      src={deck.cover_card_image}
                      alt={deck.name}
                      className="w-14 h-20 object-contain rounded-xl flex-shrink-0 bg-slate-900 border border-slate-700 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 flex-shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug line-clamp-1">{deck.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{deck.format || 'Standard'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        {deck.total_cards || 0} cartas
                      </span>
                    </div>
                  </div>
                </div>

                {deck.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic">
                    "{deck.description}"
                  </p>
                )}

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCloneDeck(deck.id)}
                    disabled={cloningId === deck.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 transition-all hover:scale-105"
                    title="Crear una copia en Mis Mazos"
                  >
                    {cloningId === deck.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Hacer Copia</span>
                  </button>

                  <Link
                    href={`/deck-builder/${deck.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all hover:scale-105"
                  >
                    <span>Ver Mazo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
