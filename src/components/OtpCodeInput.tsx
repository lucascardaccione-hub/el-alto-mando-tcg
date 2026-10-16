'use client';

import React, { useRef } from 'react';

interface OtpCodeInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  disabled?: boolean;
  accentColor?: 'blue' | 'amber';
}

export default function OtpCodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  accentColor = 'blue',
}: OtpCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const focusInput = (idx: number) => {
    const target = inputRefs.current[Math.max(0, Math.min(5, idx))];
    if (target) {
      target.focus();
      target.select();
    }
  };

  const handleDigitChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    // If multiple characters typed or autofilled
    if (clean.length > 1) {
      const sliced = clean.slice(0, 6);
      onChange(sliced);
      focusInput(Math.min(5, sliced.length));
      if (sliced.length === 6 && onComplete) {
        onComplete(sliced);
      }
      return;
    }

    const next = [...digits];
    next[index] = clean[0];
    const joined = next.join('');
    onChange(joined);

    if (index < 5) {
      focusInput(index + 1);
    }
    if (joined.length === 6 && ! next.includes('') && onComplete) {
      onComplete(joined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        onChange(next.join(''));
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        onChange(next.join(''));
        focusInput(index - 1);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < 5) {
      focusInput(index + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    focusInput(Math.min(5, pasted.length - 1));
    if (pasted.length === 6 && onComplete) {
      onComplete(pasted);
    }
  };

  const isComplete = value.replace(/\D/g, '').length === 6;

  const focusRingClass =
    accentColor === 'amber'
      ? 'focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 focus:bg-slate-900'
      : 'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 focus:bg-slate-900';

  const filledBorderClass = isComplete
    ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200 shadow-sm shadow-emerald-950/40'
    : accentColor === 'amber'
    ? 'border-amber-500/50 bg-slate-900/90 text-white'
    : 'border-blue-500/50 bg-slate-900/90 text-white';

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleDigitChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          placeholder="·"
          aria-label={`Dígito ${idx + 1}`}
          className={`w-full h-13 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-2xl border transition-all duration-200 outline-none disabled:opacity-50 ${focusRingClass} ${
            digit
              ? filledBorderClass
              : 'border-slate-700/80 bg-slate-950/80 text-white placeholder-slate-600 hover:border-slate-600'
          }`}
        />
      ))}
    </div>
  );
}
