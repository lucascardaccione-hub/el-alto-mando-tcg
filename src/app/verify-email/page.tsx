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
  const demoCode = searchParams.get('demoCode') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(demoCode);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [success, setSuccess] = useState(false);

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
        if (data.code) setCode(data.code);
        setInfoMessage('¡Nuevo código enviado con éxito!');
      }
    } catch {
      setError('Error al reenviar el código.');
    } finally {
      setResending(false);
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

              {demoCode && (
                <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-800/60 text-xs text-blue-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Código de verificación generado:</span>
                  </div>
                  <p className="text-xl font-mono font-black tracking-widest text-blue-300">{demoCode}</p>
                  <p className="text-[10px] text-slate-400">
                    (En entorno de desarrollo puedes hacer clic en verificar directamente).
                  </p>
                </div>
              )}

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
