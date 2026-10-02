'use client';

import React, { useEffect, useState } from 'react';
import { UltraBallIcon } from '@/components/UltraBallIcon';

interface Particle {
  id: number;
  char: string;
  left: string;
  top: string;
  size: string;
  color: string;
  animDuration: string;
  delay: string;
}

export function AnimatedHeroTitle() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const chars = ['✦', '✧', '⭐', '★'];
    const colors = ['text-amber-400', 'text-yellow-300', 'text-slate-200', 'text-amber-200'];
    const sizes = ['text-[8px]', 'text-[10px]', 'text-xs', 'text-sm'];

    const newParticles: Particle[] = Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      char: chars[Math.floor(Math.random() * chars.length)],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      animDuration: `${3 + Math.random() * 4}s`,
      delay: `${Math.random() * 2}s`,
    }));

    setParticles(newParticles);
  }, []);

  return (
    <div className="relative inline-block">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-40px) translateX(var(--drift)); opacity: 0; }
        }
        .animate-float-particle {
          animation: float-particle var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }
        @keyframes subtle-gold-shimmer {
          0%, 100% { filter: drop-shadow(0 0 16px rgba(234,179,8,0.4)); }
          50% { filter: drop-shadow(0 0 28px rgba(250,204,21,0.7)); }
        }
        .animate-gold-shimmer {
          animation: subtle-gold-shimmer 3s ease-in-out infinite;
        }
      `,
        }}
      />

      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${p.size} ${p.color} animate-float-particle opacity-0 pointer-events-none z-20`}
          style={
            {
              left: p.left,
              top: p.top,
              '--duration': p.animDuration,
              '--delay': p.delay,
              '--drift': Math.random() > 0.5 ? '20px' : '-20px',
            } as React.CSSProperties
          }
        >
          {p.char}
        </div>
      ))}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-tight flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-center">
          {/* Ultraball companion */}
          <span className="inline-flex items-center justify-center hover:rotate-12 transition-transform duration-300 cursor-pointer">
            <UltraBallIcon className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16" />
          </span>

          {/* EL ALTO MANDO: Plata / Plateado Metálico Brillante */}
          <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(255,255,255,0.25)]">
            EL ALTO MANDO
          </span>

          {/* TCG: Completamente Dorado / Oro Puro */}
          <span className="inline-block bg-gradient-to-b from-[#fffbeb] via-[#facc15] to-[#ca8a04] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(234,179,8,0.6)] animate-gold-shimmer font-black">
            TCG
          </span>
        </h1>
      </div>
    </div>
  );
}
