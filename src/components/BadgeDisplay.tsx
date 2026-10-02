import React from 'react';
import { PokemonBadge, PrestigeTier } from '@/lib/rewards';

interface BadgeDisplayProps {
  badge: PokemonBadge;
  prestigeTier?: PrestigeTier;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  unlocked?: boolean;
}

export function BadgeDisplay({
  badge,
  prestigeTier = 'standard',
  size = 'md',
  showLabel = false,
  unlocked = true,
}: BadgeDisplayProps) {
  const sizeMap = {
    sm: { container: 'w-7 h-7', svg: 28 },
    md: { container: 'w-10 h-10', svg: 40 },
    lg: { container: 'w-14 h-14', svg: 56 },
    xl: { container: 'w-20 h-20', svg: 80 },
  };

  const { container, svg } = sizeMap[size];

  // Colors according to prestige
  let fillColor = badge.color;
  let strokeColor = '#ffffff';
  let glowColor = badge.glow;
  let borderRing = 'border-white/10';

  if (!unlocked) {
    fillColor = '#334155';
    strokeColor = '#475569';
    glowColor = 'transparent';
    borderRing = 'border-slate-800';
  } else if (prestigeTier === 'gold') {
    fillColor = 'url(#badge-gold-grad)';
    strokeColor = '#fef08a';
    glowColor = 'rgba(234,179,8,0.7)';
    borderRing = 'border-amber-400/50 shadow-amber-500/30';
  } else if (prestigeTier === 'platinum') {
    fillColor = 'url(#badge-plat-grad)';
    strokeColor = '#e0f2fe';
    glowColor = 'rgba(186,230,253,0.8)';
    borderRing = 'border-cyan-300/50 shadow-cyan-400/40';
  }

  return (
    <div className="flex flex-col items-center gap-1.5 text-center group">
      <div
        className={`relative ${container} rounded-2xl flex items-center justify-center p-1.5 border ${borderRing} transition-all duration-300 ${
          unlocked
            ? 'bg-slate-900/90 shadow-lg group-hover:scale-110 group-hover:-translate-y-0.5'
            : 'bg-slate-950/60 opacity-40 grayscale'
        }`}
        style={{
          boxShadow: unlocked ? `0 0 16px ${glowColor}` : 'none',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width={svg}
          height={svg}
          className="w-full h-full object-contain filter drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="badge-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
            <linearGradient id="badge-plat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#bae6fd" />
              <stop offset="80%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Badge shape with dynamic path */}
          <path
            d={badge.iconSvg}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Center gem / detail */}
          <circle
            cx="50"
            cy="50"
            r="7"
            fill={unlocked ? '#ffffff' : '#64748b'}
            opacity="0.9"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </svg>

        {/* Small tier badge marker */}
        {unlocked && prestigeTier === 'gold' && (
          <span className="absolute -bottom-1 -right-1 text-[8px] px-1 rounded-full bg-amber-500 text-black font-black leading-tight border border-amber-300">
            ★
          </span>
        )}
        {unlocked && prestigeTier === 'platinum' && (
          <span className="absolute -bottom-1 -right-1 text-[8px] px-1 rounded-full bg-cyan-400 text-black font-black leading-tight border border-cyan-200">
            ✦
          </span>
        )}
      </div>

      {showLabel && (
        <div>
          <p className="text-[11px] font-bold text-white truncate max-w-[80px]">
            {badge.name}
          </p>
          <p className="text-[9px] text-slate-400 capitalize">
            {badge.leader}
          </p>
        </div>
      )}
    </div>
  );
}
