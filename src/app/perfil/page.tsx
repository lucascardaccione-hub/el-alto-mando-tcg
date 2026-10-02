'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  KeyRound,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Camera,
  Sparkles,
  ExternalLink,
  Plus,
  ArrowRight,
  Award,
} from 'lucide-react';
import { AVATAR_PRESETS, getDefaultAvatar } from '@/lib/avatars';
import { getRoleBadge } from '@/lib/roles';
import { RewardsOverview } from '@/components/RewardsOverview';
import { TrainerCard } from '@/components/TrainerCard';

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  is_verified?: number;
  created_at?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'rewards' | 'security' | 'decks'>('profile');

  // Rewards State
  const [rewardsData, setRewardsData] = useState<any>(null);
  const [loadingRewards, setLoadingRewards] = useState(false);

  // Avatar & Profile state
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [avatarCategory, setAvatarCategory] = useState<'all' | 'pokemon-sprite' | 'trainer-sprite' | 'pokemon-artwork' | 'legendary'>('all');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security / Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Decks state
  const [myDecks, setMyDecks] = useState<any[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);

  // Notifications
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    fetchProfile();
    fetchUserDecks();
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoadingRewards(true);
    try {
      const res = await fetch('/api/rewards');
      if (res.ok) {
        const data = await res.json();
        setRewardsData(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRewards(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setSelectedAvatar(data.user.avatar_url || '');
          setCustomAvatarUrl(data.user.avatar_url || '');
          setPhone(data.user.phone || '');
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDecks = async () => {
    setLoadingDecks(true);
    try {
      const res = await fetch('/api/decks?filter=my');
      if (res.ok) {
        const data = await res.json();
        setMyDecks(data.decks || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);

    const avatarToSave = customAvatarUrl.trim() || selectedAvatar;

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_url: avatarToSave,
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Error al actualizar el perfil.');
      } else {
        showNotification('success', '¡Perfil y avatar guardados con éxito!');
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch {
      showNotification('error', 'Error de conexión.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      showNotification('error', 'Ingresa tu contraseña actual.');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('error', 'Las contraseñas no coinciden.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Error al cambiar contraseña.');
      } else {
        showNotification('success', '¡Contraseña actualizada exitosamente!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      showNotification('error', 'Error de conexión.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Cargando tu perfil de entrenador...</p>
      </div>
    );
  }

  if (!user) return null;

  const roleInfo = getRoleBadge(user);
  const currentAvatarDisplay = customAvatarUrl.trim() || selectedAvatar || getDefaultAvatar(user.username);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {message && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-2xl text-xs sm:text-sm shadow-xl animate-in slide-in-from-top-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-500/60 text-emerald-300'
              : 'bg-rose-950/90 border border-rose-500/60 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Ficha de Entrenador (Trainer Card) */}
      <TrainerCard
        username={user.username}
        avatarUrl={currentAvatarDisplay}
        roleInfo={roleInfo}
        isVerified={user.is_verified === 1}
        memberDate={user.created_at ? new Date(user.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' }) : null}
        phone={user.phone}
        publicDecksCount={myDecks.length}
        levelInfo={rewardsData?.levelInfo}
      >
        <div className="flex flex-col sm:flex-row md:flex-col gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-all hover:scale-105 active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Editar Sprite</span>
          </button>

          <Link
            href={`/perfil/${user.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <span>Ver Ficha Pública</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </TrainerCard>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Avatar y Datos</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
            activeTab === 'rewards'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 font-black'
              : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Medallas y Nivel {rewardsData?.levelInfo ? `(Nv. ${rewardsData.levelInfo.level})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Cambiar Contraseña</span>
        </button>

        <button
          onClick={() => setActiveTab('decks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
            activeTab === 'decks'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mis Mazos ({myDecks.length})</span>
        </button>
      </div>

      {/* Tab 1: Profile & Avatar */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Selector */}
            <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Elige tu Foto de Avatar / Sprite</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecciona tu Sprite o Artwork favorito para lucirlo en tu Ficha de Entrenador y en la comunidad.
                </p>
              </div>

              {/* Categorías de Avatares */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setAvatarCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    avatarCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Todos ({AVATAR_PRESETS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarCategory('pokemon-sprite')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    avatarCategory === 'pokemon-sprite'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🎮 Sprites Pokémon
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarCategory('trainer-sprite')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    avatarCategory === 'trainer-sprite'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🧢 Entrenadores & Campeones
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarCategory('pokemon-artwork')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    avatarCategory === 'pokemon-artwork'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🎨 Artwork Oficial
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarCategory('legendary')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    avatarCategory === 'legendary'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ⭐ Legendarios
                </button>
              </div>

              {/* Grid of Presets */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {AVATAR_PRESETS.filter(
                  (p) => avatarCategory === 'all' || p.category === avatarCategory
                ).map((preset) => {
                  const isSelected = selectedAvatar === preset.url && !customAvatarUrl.trim();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset.url);
                        setCustomAvatarUrl('');
                      }}
                      className={`relative flex flex-col items-center justify-between p-2 rounded-2xl transition-all aspect-square ${
                        isSelected
                          ? 'bg-blue-600/30 border-2 border-blue-400 scale-105 shadow-lg shadow-blue-900/50'
                          : 'bg-slate-900/80 border border-slate-800 hover:border-slate-600 hover:scale-105'
                      }`}
                      title={preset.name}
                    >
                      <div className="w-full flex-1 flex items-center justify-center p-1">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-contain filter drop-shadow"
                        />
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center mt-0.5">
                        {preset.name.replace(' Sprite', '').split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Image URL Option */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  O usa una URL de imagen personalizada
                </label>
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/tu-foto.png"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Contacto de WhatsApp</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Si vendes cartas o compras en la tienda, tu WhatsApp se usará para coordinar los pedidos de cartas.
                </p>
              </div>

              <div className="max-w-md space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Número de WhatsApp (con código de país)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 5491123456789"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="py-3 px-6 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Perfil y Avatar</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Rewards, Level & Badges */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {loadingRewards ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-[#0b1220]/80 border border-slate-800 rounded-3xl">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-400">Calculando tus medallas y nivel de entrenador...</p>
            </div>
          ) : rewardsData?.levelInfo ? (
            <RewardsOverview
              levelInfo={rewardsData.levelInfo}
              stats={rewardsData.stats}
              regions={rewardsData.regions}
            />
          ) : (
            <div className="p-8 text-center bg-[#0b1220]/80 border border-slate-800 rounded-3xl">
              <p className="text-slate-400 text-sm">No se pudo cargar la información de recompensas.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="max-w-md">
          <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>Modificar Contraseña</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa tu clave actual y define una nueva contraseña segura.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: My Decks */}
      {activeTab === 'decks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Mis Mazos ({myDecks.length})</span>
            </h3>
            <Link
              href="/deck-builder"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Mazo</span>
            </Link>
          </div>

          {loadingDecks ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Cargando tus mazos...</span>
            </div>
          ) : myDecks.length === 0 ? (
            <div className="text-center py-12 bg-[#0b1220]/60 border border-slate-800/80 rounded-3xl p-6 space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">Aún no tienes mazos creados</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Arma tu primer mazo en el Deck Builder o copia uno de los mazos de la comunidad.
              </p>
              <Link
                href="/deck-builder"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all"
              >
                <span>Ir al Creador de Mazos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-[#0b1220]/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {deck.cover_card_image ? (
                      <img
                        src={deck.cover_card_image}
                        alt={deck.name}
                        className="w-12 h-16 object-contain rounded-lg flex-shrink-0 bg-slate-900 border border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 flex-shrink-0">
                        <Layers className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm text-white truncate">{deck.name}</h4>
                      <p className="text-[11px] text-slate-400">{deck.format || 'Standard'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {deck.total_cards || 0} cartas
                        </span>
                        {deck.is_public === 1 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                            Público
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                            Privado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    <Link
                      href={`/deck-builder/${deck.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                    >
                      Editar en Builder
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
