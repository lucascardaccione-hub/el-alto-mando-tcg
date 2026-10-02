import React from 'react';
import Image from 'next/image';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { UserLevelInfo } from '@/lib/rewards';
import { RoleInfo } from '@/lib/roles';

interface TrainerCardProps {
  username: string;
  avatarUrl: string;
  roleInfo: RoleInfo;
  isVerified?: boolean;
  memberDate?: string | null;
  phone?: string | null;
  publicDecksCount?: number;
  levelInfo?: UserLevelInfo | null;
  className?: string;
  children?: React.ReactNode;
}

export function TrainerCard({
  username,
  avatarUrl,
  roleInfo,
  isVerified = false,
  memberDate,
  phone,
  publicDecksCount = 0,
  levelInfo,
  className = '',
  children,
}: TrainerCardProps) {
  // Format trainer ID code (e.g. ID No. 49201)
  const idNumber = Math.abs(
    username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1024)
  )
    .toString()
    .padStart(5, '0')
    .slice(-5);

  const isPlatinum = levelInfo?.prestigeTier === 'platinum';
  const isGold = levelInfo?.prestigeTier === 'gold';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-500 shadow-2xl p-6 sm:p-8 ${
        isPlatinum
          ? 'bg-gradient-to-br from-[#0c1e33] via-[#091524] to-[#040810] border-cyan-400/40 shadow-cyan-950/40'
          : isGold
          ? 'bg-gradient-to-br from-[#231b08] via-[#141005] to-[#080702] border-amber-400/50 shadow-amber-950/40'
          : 'bg-gradient-to-br from-[#0e172a] via-[#0a101f] to-[#050812] border-white/15 shadow-blue-950/30'
      } ${className}`}
    >
      {/* Background Holographic Texture Grid & Ambient Orbs */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Trainer Card Header Band */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden border border-white/20">
            <Image
              src="/logo.png"
              alt="Logo Oficial"
              width={22}
              height={22}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-300">
            Ficha de Entrenador Oficial
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400 font-bold">IDNo.</span>
          <span className="font-black text-amber-300 tracking-wider text-sm bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-white/10">
            {idNumber}
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
        {/* Photo Box: Pixel/Artwork Sprite display framed like a card portrait */}
        <div className="relative flex-shrink-0 group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-950 border-2 border-white/20 shadow-2xl flex items-center justify-center p-2 relative">
            {/* Background grid inside photo frame */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
            <img
              src={avatarUrl}
              alt={username}
              className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          {/* Badge icon stamp on corner if levelInfo exists */}
          {levelInfo && (
            <div className="absolute -bottom-2 -right-2">
              <BadgeDisplay
                badge={levelInfo.currentBadge}
                prestigeTier={levelInfo.prestigeTier}
                size="sm"
                unlocked={true}
              />
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center md:justify-start">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
              {username}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeClass}`}
              >
                <span>{roleInfo.icon}</span>
                <span>{roleInfo.label}</span>
              </span>
              {isVerified && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  ✓ Verificado
                </span>
              )}
            </div>
          </div>

          {/* Trainer Card Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="bg-slate-900/70 border border-white/5 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                Rango
              </span>
              <span className="font-bold text-white truncate block">
                {roleInfo.label}
              </span>
            </div>

            <div className="bg-slate-900/70 border border-white/5 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                Nivel Entrenador
              </span>
              <span className="font-black text-amber-300 block">
                Nv. {levelInfo?.level || 1}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  ({levelInfo?.currentBadge?.prestigeLabel || 'Base'})
                </span>
              </span>
            </div>

            <div className="bg-slate-900/70 border border-white/5 rounded-xl p-2.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                Mazos Guardados
              </span>
              <span className="font-bold text-blue-300 block">
                {publicDecksCount} {publicDecksCount === 1 ? 'Mazo' : 'Mazos'}
              </span>
            </div>
          </div>

          {/* Subtitle / Bio / Contact */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 pt-1">
            {memberDate && (
              <span>Miembro desde {memberDate}</span>
            )}
            {phone && (
              <span className="text-emerald-400 font-semibold">WhatsApp: +{phone}</span>
            )}
          </div>
        </div>

        {/* Extra children slot (e.g. Action buttons, QR or Edit) */}
        {children && (
          <div className="md:self-center flex-shrink-0 pt-2 md:pt-0">
            {children}
          </div>
        )}
      </div>

      {/* Mini Badges Ribbon bar at bottom of trainer card */}
      {levelInfo && (
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Medalla Activa:
            </span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <span>{levelInfo.currentBadge.name}</span>
              <span className="text-slate-400">({levelInfo.currentBadge.city})</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-300 font-mono font-bold text-xs">
              {levelInfo.exp} EXP
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
