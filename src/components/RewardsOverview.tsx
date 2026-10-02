'use client';

import React, { useState } from 'react';
import { Award, Sparkles, ChevronRight, HelpCircle, Flame, Layers, MessageCircle, Heart, ShoppingBag } from 'lucide-react';
import { UserLevelInfo, RegionGyms, POKEMON_REGIONS } from '@/lib/rewards';
import { BadgeDisplay } from '@/components/BadgeDisplay';

interface RewardsOverviewProps {
  levelInfo: UserLevelInfo;
  stats?: {
    decksCount?: number;
    commentsCount?: number;
    likesCount?: number;
    ordersCount?: number;
    totalSpent?: number;
  };
  regions?: RegionGyms[];
}

export function RewardsOverview({ levelInfo, stats, regions = POKEMON_REGIONS }: RewardsOverviewProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('kanto');
  const [showFaq, setShowFaq] = useState(false);

  const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
  const regionIndex = regions.findIndex((r) => r.id === selectedRegionId);

  // Calculate prestige for this region relative to user level
  // 8 badges per region
  const regionStartBadgeOverall = regionIndex * 8; // 0 for kanto, 8 for johto, etc.
  const regionEndBadgeOverall = regionStartBadgeOverall + 8;

  // Has user passed this region entirely in current loop?
  const zeroBasedLevel = levelInfo.level - 1;
  const loopCount = Math.floor(zeroBasedLevel / (regions.length * 8));

  return (
    <div className="space-y-6">
      {/* Level Summary Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131b2e] via-[#0d1424] to-[#070b14] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Badge Display on Left */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <BadgeDisplay
                badge={levelInfo.currentBadge}
                prestigeTier={levelInfo.prestigeTier}
                size="xl"
                unlocked={true}
              />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Nivel de Entrenador {levelInfo.level}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    levelInfo.prestigeTier === 'platinum'
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-400/40'
                      : levelInfo.prestigeTier === 'gold'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-400/50 shadow-sm shadow-amber-400/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {levelInfo.currentBadge.prestigeLabel}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {levelInfo.currentBadge.name}
              </h2>
              <p className="text-xs text-slate-300">
                Gimnasio de {levelInfo.currentBadge.city} · Líder {levelInfo.currentBadge.leader} ({levelInfo.currentBadge.regionName})
              </p>
            </div>
          </div>

          {/* EXP Progress Meter */}
          <div className="w-full md:w-72 space-y-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Progreso Siguiente Nivel
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {levelInfo.expCurrentLevel} / {levelInfo.expNextLevel} EXP
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-700 shadow-sm shadow-amber-400"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>{levelInfo.progressPercent}% completado</span>
              <span className="text-slate-300 font-bold">{levelInfo.exp} EXP Totales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activities / EXP Sources */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#0b1220]/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black text-white">{stats.decksCount || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">Mazos Creados (+50 XP)</p>
            </div>
          </div>

          <div className="bg-[#0b1220]/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black text-white">{stats.commentsCount || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">Comentarios (+15 XP)</p>
            </div>
          </div>

          <div className="bg-[#0b1220]/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black text-white">{stats.likesCount || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">Likes Dados (+5 XP)</p>
            </div>
          </div>

          <div className="bg-[#0b1220]/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black text-white">{stats.ordersCount || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">Compras Tienda (+100 XP)</p>
            </div>
          </div>
        </div>
      )}

      {/* Gym Badges Explorer by Region */}
      <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Medallero Pokémon por Región</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Desbloquea las 8 medallas de cada región subiendo de nivel con interacciones en la plataforma.
            </p>
          </div>

          <button
            onClick={() => setShowFaq(!showFaq)}
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo funciona el prestigio infinito?</span>
          </button>
        </div>

        {/* FAQ Dropdown */}
        {showFaq && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-300 space-y-2 animate-in fade-in">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Sistema Infinito de Prestigio:
            </p>
            <p>
              1. <strong>Fase Normal:</strong> Desbloqueas las 8 medallas canónicas de cada región (Kanto, Johto, Hoenn, Sinnoh, Teselia, Kalos, Alola, Galar, Paldea) para un total de <strong>72 medallas base</strong>.
            </p>
            <p>
              2. <strong>Fase Dorada (Prestigio Oro ⭐):</strong> Al superar el nivel 72, comienzas nuevamente la travesía con todas las medallas forjadas en <strong>Oro Puro</strong> con resplandores dorados.
            </p>
            <p>
              3. <strong>Fase Platino (Prestigio Platino 👑):</strong> Al superar el nivel 144, entras al nivel supremo donde tus medallas se convierten en <strong>Platino Celestial</strong> de forma infinita.
            </p>
          </div>
        )}

        {/* Region Tabs Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {regions.map((reg, idx) => {
            const isSelected = reg.id === selectedRegionId;
            const regionUnlockedBadges = Math.max(0, Math.min(8, levelInfo.level - (idx * 8)));
            return (
              <button
                key={reg.id}
                onClick={() => setSelectedRegionId(reg.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-850 border border-slate-800'
                }`}
              >
                <span>{reg.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {regionUnlockedBadges}/8
                </span>
              </button>
            );
          })}
        </div>

        {/* 8 Badges of Selected Region */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 pt-4">
          {activeRegion.badges.map((b, idx) => {
            const badgeOverallLevel = regionStartBadgeOverall + idx + 1;
            const isUnlocked = levelInfo.level >= badgeOverallLevel;

            // Determine if this badge is gold/plat for the user
            let badgePrestige = 'standard' as any;
            if (levelInfo.level >= badgeOverallLevel + 72 * 2) {
              badgePrestige = 'platinum';
            } else if (levelInfo.level >= badgeOverallLevel + 72) {
              badgePrestige = 'gold';
            }

            return (
              <div
                key={b.id}
                className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center border transition-all ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-slate-700/80 hover:border-amber-400/50 shadow-md'
                    : 'bg-slate-950/40 border-slate-850 opacity-50'
                }`}
              >
                <BadgeDisplay
                  badge={b}
                  prestigeTier={badgePrestige}
                  size="md"
                  unlocked={isUnlocked}
                />
                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] font-bold text-white truncate max-w-[90px]">
                    {b.name}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {b.city}
                  </p>
                  <p className="text-[9px] text-amber-400/90 font-semibold">
                    {isUnlocked ? `Nv. ${badgeOverallLevel} ✓` : `Nv. ${badgeOverallLevel}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
