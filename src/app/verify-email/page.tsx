'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Wand2,
  Lock,
} from 'lucide-react';
import OtpCodeInput from '@/components/OtpCodeInput';
import { validateAndSuggestEmail } from '@/lib/security';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Correction of mistyped email
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [needsPasswordForChange, setNeedsPasswordForChange] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  // Cooldown timer tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (tokenParam) {
      handleVerify({ token: tokenParam });
    }
  }, [tokenParam]);

  const handleVerify = async (params: { code?: string; token?: string }) => {
    const codeToUse = (params.code ?? code).trim();
    const tokenToUse = (params.token ?? tokenParam).trim();

    if (!tokenToUse && codeToUse.length < 6) {
      setError('Por favor ingresa los 6 dígitos del código de verificación.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: codeToUse,
          token: tokenToUse,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código de verificación incorrecto o expirado.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/decks');
      }, 1400);
    } catch {
      setError('Error al procesar la verificación.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Ingresa tu email para reenviar el código.');
      return;
    }
    if (cooldown > 0) return;

    setError('');
    setInfoMessage('');
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al reenviar código.');
        if (data.waitSeconds) setCooldown(data.waitSeconds);
      } else {
        setCode('');
        setCooldown(data.cooldownSeconds || 45);
        setInfoMessage('¡Nuevo código enviado con éxito! Revisa tu bandeja de entrada o spam.');
      }
    } catch {
      setError('Error al reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  const handleNewEmailInputChange = (val: string) => {
    setNewEmailInput(val);
    if (val.includes('@') && val.split('@')[1]?.includes('.')) {
      const check = validateAndSuggestEmail(val);
      setEmailSuggestion(check.suggestion || null);
    } else {
      setEmailSuggestion(null);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = newEmailInput.trim();
    if (!targetEmail) {
      setError('Ingresa tu nuevo correo electrónico.');
      return;
    }

    const check = validateAndSuggestEmail(targetEmail);
    if (!check.valid) {
      setError(check.reason || 'El formato del correo no es válido.');
      if (check.suggestion) setEmailSuggestion(check.suggestion);
      return;
    }

    setError('');
    setInfoMessage('');
    setChangingEmail(true);

    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: email.trim(),
          newEmail: targetEmail,
          password: confirmPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresPassword) {
          setNeedsPasswordForChange(true);
        }
        if (data.suggestion) {
          setEmailSuggestion(data.suggestion);
        }
        setError(data.error || 'Error al cambiar el correo.');
      } else {
        setEmail(data.newEmail);
        setShowChangeEmail(false);
        setNewEmailInput('');
        setConfirmPassword('');
        setNeedsPasswordForChange(false);
        setCode('');
        setCooldown(30);
        setInfoMessage('¡Correo actualizado! Hemos enviado un nuevo código de 6 dígitos a ' + data.newEmail);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('email', data.newEmail);
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setChangingEmail(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify({ code });
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link
            href="/"
            className="relative w-16 h-16 flex items-center justify-center p-2 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl brand-glow hover:scale-105 transition-transform"
          >
            <Image src="/logo.png" alt="El Alto Mando TCG" width={60} height={60} className="object-contain" priority />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-bold text-blue-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Paso Final de Seguridad</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Verificación de Email</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Ingresa el código enviado a <strong className="text-white">{email || 'tu correo'}</strong> para activar tu cuenta.
            </p>
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowChangeEmail(!showChangeEmail);
                  setError('');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
              >
                <span>¿Te equivocaste de correo? Haz clic aquí para corregirlo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {success ? (
            <div className="p-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-900/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-lg text-white">¡Email Verificado con Éxito!</h3>
              <p className="text-xs text-slate-400">
                Tu cuenta está activa y protegida. Entrando a El Alto Mando TCG...
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

              {showChangeEmail && (
                <form
                  onSubmit={handleChangeEmail}
                  className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3 text-left animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Corregir Correo Electrónico</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowChangeEmail(false)}
                      className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded-md hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Ingresa tu dirección de correo real para enviarte un nuevo código de activación:
                  </p>
                  <div className="space-y-2.5">
                    <input
                      type="email"
                      required
                      value={newEmailInput}
                      onChange={(e) => handleNewEmailInputChange(e.target.value)}
                      placeholder="nuevo.correo@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />

                    {emailSuggestion && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-950/80 border border-amber-400/50 text-[11px] text-amber-200">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Wand2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate">
                            ¿Quisiste decir <strong className="text-white underline">{emailSuggestion}</strong>?
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewEmailInput(emailSuggestion);
                            setEmailSuggestion(null);
                            setError('');
                          }}
                          className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px]"
                        >
                          Usar
                        </button>
                      </div>
                    )}

                    {needsPasswordForChange && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                          Confirma tu contraseña por seguridad
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Tu contraseña de registro"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={changingEmail}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-900/30 disabled:opacity-50"
                    >
                      {changingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Guardar Correo y Reenviar Código</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="p-3.5 rounded-2xl bg-blue-950/35 border border-blue-800/40 text-xs text-blue-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Revisa tu bandeja de entrada</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Ingresa o pega el código de 6 dígitos que enviamos a tu casilla. Puedes pegar el código completo directamente.
                </p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-5">
                {!emailParam && !email && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Tu Correo
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Código de 6 Dígitos
                    </label>
                    {code.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCode('')}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <OtpCodeInput
                    value={code}
                    onChange={setCode}
                    onComplete={(completedCode) => handleVerify({ code: completedCode })}
                    disabled={loading}
                    accentColor="blue"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando código...</span>
                    </>
                  ) : (
                    <>
                      <span>Activar Mi Cuenta</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  disabled={resending || cooldown > 0}
                  onClick={handleResendCode}
                  className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 font-medium"
                >
                  {resending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>
                    {cooldown > 0
                      ? `Reenviar código en ${cooldown}s`
                      : '¿No recibiste el código? Reenviar'}
                  </span>
                </button>

                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2">
                  Iniciar Sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
