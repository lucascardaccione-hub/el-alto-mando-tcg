'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Correction of mistyped email
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (tokenParam) {
      handleVerify({ token: tokenParam });
    }
  }, [tokenParam]);

  const handleVerify = async (params: { code?: string; token?: string }) => {
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: params.code || code.trim(),
          token: params.token || tokenParam,
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
      }, 1500);
    } catch (e) {
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
      } else {
        setInfoMessage('¡Nuevo código enviado con éxito! Revisa tu bandeja de entrada o spam.');
      }
    } catch {
      setError('Error al reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim()) {
      setError('Ingresa tu nuevo correo electrónico.');
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
          newEmail: newEmailInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al cambiar el correo.');
      } else {
        setEmail(data.newEmail);
        setShowChangeEmail(false);
        setNewEmailInput('');
        setInfoMessage('¡Correo actualizado! Te enviamos un nuevo código a ' + data.newEmail);
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
    if (!code || code.length < 4) {
      setError('Por favor ingresa el código de 6 dígitos.');
      return;
    }
    handleVerify({ code });
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="relative w-16 h-16 flex items-center justify-center p-2 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl brand-glow hover:scale-105 transition-transform">
            <Image src="/logo.png" alt="El Alto Mando TCG" width={60} height={60} className="object-contain" priority />
          </Link>
          <div>
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
                Tu cuenta está activa. Redirigiéndote al Deck Builder...
              </p>
              <div className="pt-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-400" />
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs sm:text-sm animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {infoMessage && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs sm:text-sm animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {showChangeEmail && (
                <form
                  onSubmit={handleChangeEmail}
                  className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3 text-left animate-in fade-in"
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
                  <p className="text-[11px] text-slate-300">
                    Ingresa tu correo correcto para transferir tu código de activación:
                  </p>
                  <div className="space-y-2">
                    <input
                      type="email"
                      required
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="nuevo.correo@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
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

              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Código enviado a tu correo</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Hemos enviado un código numérico de 6 dígitos a tu casilla de correo. Ingrésalo a continuación para activar tu cuenta de entrenador.
                </p>
                <p className="text-[10px] text-slate-400">
                  (Si no lo ves en unos segundos, revisa tu carpeta de correo no deseado o spam).
                </p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                {!emailParam && (
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

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Código de 6 Dígitos
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center text-2xl tracking-[0.3em] font-mono font-black py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando...</span>
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
                  disabled={resending}
                  onClick={handleResendCode}
                  className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {resending && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                  <span>¿No recibiste el código? Reenviar</span>
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
