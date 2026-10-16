'use client';

import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { evaluatePasswordStrength } from '@/lib/security';

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const strength = evaluatePasswordStrength(password);

  return (
    <div className="pt-1.5 space-y-2 animate-in fade-in duration-200">
      {/* 4-Segment Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Seguridad de clave:</span>
          </span>
          <span
            className={`font-bold ${
              strength.score === 0
                ? 'text-rose-400'
                : strength.score === 1
                ? 'text-amber-400'
                : strength.score === 2
                ? 'text-yellow-300'
                : strength.score === 3
                ? 'text-emerald-400'
                : 'text-blue-400'
            }`}
          >
            {strength.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 h-1.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`rounded-full transition-all duration-300 ${
                strength.score >= step
                  ? strength.color
                  : step === 1 && strength.score === 0 && password.length > 0
                  ? 'bg-rose-500/70'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Checklist Pills */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
            strength.checks.minLength
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-semibold'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
        >
          <Check className="w-2.5 h-2.5" />
          6+ caracteres
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
            strength.checks.hasUpperOrLower
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-semibold'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
        >
          <Check className="w-2.5 h-2.5" />
          Mayús/Minús
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
            strength.checks.hasNumber || strength.checks.hasSpecial
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-semibold'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
        >
          <Check className="w-2.5 h-2.5" />
          Número o símbolo
        </span>
      </div>
    </div>
  );
}

export default PasswordStrengthMeter;
