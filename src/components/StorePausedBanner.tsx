'use client';

import React from 'react';
import { PauseCircle } from 'lucide-react';
import { useStoreStatus } from '@/hooks/useStoreStatus';

export default function StorePausedBanner({ className = '' }: { className?: string }) {
  const { paused, message } = useStoreStatus();
  if (!paused) return null;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 p-4 rounded-2xl border border-amber-500/50 bg-amber-950/50 text-amber-100 shadow-lg shadow-amber-950/30 ${className}`}
    >
      <PauseCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="text-sm font-extrabold text-amber-300">Tienda en pausa</p>
        <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
