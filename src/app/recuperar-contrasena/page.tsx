'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [step, setStep] = useState<1 | 2>(tokenParam ? 2 : 1);
  const [identifier, setIdentifier] = useState(emailParam);
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoCode, setDemoCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Ingresa tu nombre de usuario o correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al solicitar el código de recuperación.');
        setLoading(false);
        return;
      }

      setEmail(data.email || identifier.trim());
      if (data.code) {
        setDemoCode(data.code);
        setCode(data.code);
      }
      if (data.token) {
        setToken(data.token);
      }
      setStep(2);
    } catch {
      setError('Error de conexión. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!token && (!email || !code)) {
      setError('Por favor ingresa el código de 6 dígitos.');
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
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="relative w-16 h-16 flex items-center justify-center p-2 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl brand-glow hover:scale-105 transition-transform">
            <Image src="/logo.png" alt="El Alto Mando TCG" width={60} height={60} className="object-contain" priority />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Recuperar Contraseña</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {step === 1
                ? 'Ingresa tu usuario o correo para enviarte un código de recuperación.'
                : 'Ingresa el código recibido y tu nueva contraseña.'}
            </p>
          </div>
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
                Redirigiéndote a la pantalla de inicio de sesión...
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

              {demoCode && step === 2 && (
                <div className="p-3.5 rounded-2xl bg-purple-950/50 border border-purple-800/60 text-xs text-purple-300 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Código de recuperación generado:</span>
                  </div>
                  <p className="text-2xl font-mono font-black tracking-widest text-purple-200">{demoCode}</p>
                  <p className="text-[10px] text-slate-400">
                    Válido por 1 hora.
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando código...</span>
                      </>
                    ) : (
                      <>
                        <span>Continuar</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {!tokenParam && (
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
                        className="w-full text-center text-2xl tracking-[0.3em] font-mono font-black py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
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
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
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
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Guardar Nueva Contraseña</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Volver al paso anterior</span>
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
