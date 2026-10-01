'use client';

import React, { useEffect, useState } from 'react';

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
    const colors = ['text-blue-400', 'text-indigo-300', 'text-amber-300', 'text-white'];
    const sizes = ['text-[8px]', 'text-[10px]', 'text-xs', 'text-sm'];
    
    const newParticles: Particle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      char: chars[Math.floor(Math.random() * chars.length)],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      animDuration: `${3 + Math.random() * 4}s`,
      delay: `${Math.random() * 2}s`
    }));
    
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative inline-block">
      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />
      
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute ${p.size} ${p.color} animate-float-particle opacity-0 pointer-events-none`}
          style={{
            left: p.left,
            top: p.top,
            '--duration': p.animDuration,
            '--delay': p.delay,
            '--drift': Math.random() > 0.5 ? '20px' : '-20px'
          } as React.CSSProperties}
        >
          {p.char}
        </div>
      ))}
      <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-white leading-tight relative z-10 flex flex-wrap justify-center gap-3">
        EL ALTO MANDO{' '}
        <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
          TCG
        </span>
      </h1>
    </div>
  );
}
