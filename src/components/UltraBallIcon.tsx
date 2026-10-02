import React from 'react';

interface UltraBallIconProps {
  className?: string;
  size?: number;
}

export function UltraBallIcon({ className = 'w-7 h-7 sm:w-9 sm:h-9', size = 32 }: UltraBallIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`inline-block drop-shadow-[0_0_12px_rgba(234,179,8,0.5)] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="ub-top" cx="35%" cy="25%" r="65%">
          <stop offset="0%" stopColor="#2c3038" />
          <stop offset="70%" stopColor="#141820" />
          <stop offset="100%" stopColor="#080a0f" />
        </radialGradient>
        <radialGradient id="ub-bottom" cx="35%" cy="75%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <linearGradient id="ub-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <radialGradient id="ub-btn" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </radialGradient>
      </defs>

      {/* Outer rim shadow */}
      <circle cx="50" cy="50" r="48" fill="#05070a" />

      {/* Top half (Dark Charcoal / Black) */}
      <path d="M 4 50 A 46 46 0 0 1 96 50 Z" fill="url(#ub-top)" />

      {/* Ultra Ball Gold Stripes (Iconic H / U-shape top arches) */}
      <path
        d="M 22 14 C 28 8 36 6 42 6 L 40 18 C 36 18 31 19 27 23 Z"
        fill="url(#ub-gold)"
      />
      <path
        d="M 78 14 C 72 8 64 6 58 6 L 60 18 C 64 18 69 19 73 23 Z"
        fill="url(#ub-gold)"
      />
      <path
        d="M 22 14 L 32 46 L 22 46 Z"
        fill="url(#ub-gold)"
      />
      <path
        d="M 78 14 L 68 46 L 78 46 Z"
        fill="url(#ub-gold)"
      />

      {/* Bottom half (White / Silver) */}
      <path d="M 4 50 A 46 46 0 0 0 96 50 Z" fill="url(#ub-bottom)" />

      {/* Dividing black equator seam */}
      <rect x="4" y="46" width="92" height="8" fill="#090d16" />

      {/* Outer Button Ring */}
      <circle cx="50" cy="50" r="16" fill="#090d16" />
      <circle cx="50" cy="50" r="12" fill="#1e293b" />

      {/* Center Button */}
      <circle cx="50" cy="50" r="8" fill="url(#ub-btn)" />
      <circle cx="48" cy="48" r="2.5" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}
