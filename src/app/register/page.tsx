'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { validateAndSuggestEmail } from '@/lib/security';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.includes('@') && val.split('@')[1]?.includes('.')) {
      const check = validateAndSuggestEmail(val);
      setEmailSuggestion(check.suggestion || null);
    } else {
      setEmailSuggestion(null);
    }
  };

  const applySuggestion = () => {
    if (emailSuggestion) {
      setEmail(emailSuggestion);
      setEmailSuggestion(null);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    const emailCheck = validateAndSuggestEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.reason || 'El correo electrónico no es válido.');
      if (emailCheck.suggestion) setEmailSuggestion(emailCheck.suggestion);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear la cuenta.');
        if (data.suggestion) setEmailSuggestion(data.suggestion);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        if (data.requiresVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        } else {
          router.push('/decks');
        }
        router.refresh();
      }, 900);
    } catch {
      setError('Error de conexión. Inténtalo nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient sapphire & gold glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link
            href="/"
            className="relative w-20 h-20 flex items-center justify-center p-2 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl brand-glow hover:scale-105 transition-transform"
          >
            <Image src="/logo.png" alt="El Alto Mando TCG" width={70} height={70} className="object-contain" priority />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-bold text-blue-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Registro Seguro con Confirmación por Email</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crear Cuenta</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Únete a <strong className="text-slate-200">El Alto Mando TCG</strong> para armar tus mazos y gestionar tus pedidos.
            </p>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs sm:text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <div>
                <strong className="block font-bold">¡Cuenta creada con éxito!</strong>
                <span>Enviando código de activación a tu correo...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Nombre de Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={24}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: RedTrainer"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Email with Smart Typo Detection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Correo Electrónico Real
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="tu@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    emailSuggestion
                      ? 'border-amber-500/70 focus:border-amber-400'
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                />
              </div>

              {emailSuggestion && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 animate-in fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Wand2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">
                      ¿Quisiste decir <strong className="text-white underline">{emailSuggestion}</strong>?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={applySuggestion}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex-shrink-0 transition-colors"
                  >
                    Corregir
                  </button>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  tabIndex={-1}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[10px] font-bold ${
                      password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {password === confirmPassword ? '✓ Coinciden' : '✕ No coinciden'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta segura...</span>
                </>
              ) : (
                <>
                  <span>Crear Cuenta y Recibir Código</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
