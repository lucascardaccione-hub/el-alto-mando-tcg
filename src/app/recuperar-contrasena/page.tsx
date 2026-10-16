'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import OtpCodeInput from '@/components/OtpCodeInput';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [step, setStep] = useState<1 | 2>(tokenParam ? 2 : 1);
  const [identifier, setIdentifier] = useState(emailParam);
  const [email, setEmail] = useState(emailParam);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
      setStep(2);
    }
    if (emailParam) {
      setEmail(emailParam);
      setIdentifier(emailParam);
    }
  }, [tokenParam, emailParam]);

  // Step 1: Request reset code
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMessage('');

    const targetId = (identifier || email).trim();
    if (!targetId) {
      setError('Ingresa tu nombre de usuario o correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al solicitar el código de recuperación.');
        if (data.waitSeconds) setCooldown(data.waitSeconds);
        setLoading(false);
        return;
      }

      setEmail(data.email || targetId);
      setMaskedEmail(data.maskedEmail || data.email || targetId);
      setCooldown(data.cooldownSeconds || 45);
      setStep(2);
    } catch {
      setError('Error de conexión. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetCode = async () => {
    if (cooldown > 0) return;
    setError('');
    setInfoMessage('');
    setResending(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: (email || identifier).trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al reenviar el código.');
        if (data.waitSeconds) setCooldown(data.waitSeconds);
      } else {
        setCode('');
        setCooldown(data.cooldownSeconds || 45);
        setInfoMessage('¡Nuevo código de recuperación enviado a tu correo!');
      }
    } catch {
      setError('Error al reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!newPassword || newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!token && (!email || code.length < 6)) {
      setError('Por favor ingresa los 6 dígitos del código enviado a tu correo.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al restablecer la contraseña.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('Error al procesar el cambio de contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link
            href="/"
            className="relative w-16 h-16 flex items-center justify-center p-2 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl brand-glow hover:scale-105 transition-transform"
          >
            <Image src="/logo.png" alt="El Alto Mando TCG" width={60} height={60} className="object-contain" priority />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-[11px] font-bold text-amber-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Recuperación Protegida en 2 Pasos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Recuperar Contraseña</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {step === 1
                ? 'Ingresa tu usuario o correo para recibir un código de seguridad.'
                : 'Ingresa el código recibido por email y define tu nueva clave.'}
            </p>
          </div>

          {/* 2-Step Visual Stepper */}
          {!success && (
            <div className="flex items-center gap-2 pt-1">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                  step === 1
                    ? 'bg-blue-600/25 border-blue-500/50 text-blue-300'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Identificación</span>
              </div>
              <div className="w-6 h-0.5 bg-slate-800 rounded-full" />
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                  step === 2
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Verificación & Clave</span>
              </div>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {success ? (
            <div className="p-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-900/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-lg text-white">¡Contraseña Cambiada con Éxito!</h3>
              <p className="text-xs text-slate-400">
                También enviamos un aviso de seguridad a tu correo. Redirigiéndote al inicio de sesión...
              </p>
              <div className="pt-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-400" />
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs sm:text-sm animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {infoMessage && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs sm:text-sm animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {step === 2 && (
                <div className="p-3.5 rounded-2xl bg-amber-950/35 border border-amber-800/50 text-xs text-amber-200 space-y-1 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Código enviado a tu correo</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                      Expira en 1h
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Enviamos un código de 6 dígitos a <strong className="text-white">{maskedEmail || email}</strong>. Revisa tu bandeja principal o spam.
                  </p>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Usuario o Correo Registrado
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="tu_usuario o tu@email.com"
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
                        <span>Enviando código seguro...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Código de Recuperación</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {!tokenParam && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Código de Seguridad (6 Dígitos)
                        </label>
                        <button
                          type="button"
                          disabled={resending || cooldown > 0}
                          onClick={handleResendResetCode}
                          className="text-[11px] text-amber-400 hover:text-amber-300 disabled:text-slate-500 flex items-center gap-1 font-semibold"
                        >
                          <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                          <span>{cooldown > 0 ? `Reenviar (${cooldown}s)` : 'Reenviar código'}</span>
                        </button>
                      </div>
                      <OtpCodeInput
                        value={code}
                        onChange={setCode}
                        disabled={loading}
                        accentColor="amber"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={newPassword} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Confirmar Nueva Contraseña
                      </label>
                      {confirmPassword.length > 0 && (
                        <span
                          className={`text-[10px] font-bold ${
                            newPassword === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {newPassword === confirmPassword ? '✓ Coinciden' : '✕ No coinciden'}
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
                        placeholder="Repite la nueva contraseña"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (!tokenParam && code.length < 6)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Actualizando contraseña...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Guardar Nueva Contraseña</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError('');
                      }}
                      className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Cambiar usuario o correo</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2">
                  Volver al Inicio de Sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
