'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ShieldCheck, Box, Layers, Sparkles, User, UserPlus, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface NavbarProps {
  totalCards?: number;
  totalStock?: number;
}

interface UserSession {
  id: number;
  username: string;
  role: string;
  email?: string;
  is_verified?: number;
}

export default function Navbar({ totalCards = 0, totalStock = 0 }: NavbarProps) {
  const { totalCount, openCart } = useCart();
  const [user, setUser] = useState<UserSession | null>(null);
  const pathname = usePathname() || '/';

  const getSectionBadge = () => {
    if (pathname.startsWith('/deck-builder')) {
      return { primary: 'Deck Builder', secondary: 'Creador de Mazos' };
    }
    if (pathname.startsWith('/decks')) {
      return { primary: 'Decks de la Comunidad', secondary: 'Metagame Oficial' };
    }
    if (pathname.startsWith('/admin')) {
      return { primary: 'Panel de Control', secondary: 'Administración' };
    }
    if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/verify-email')) {
      return { primary: 'Mi Cuenta', secondary: 'El Alto Mando' };
    }
    return { primary: 'Tienda Oficial', secondary: 'Stock en Vivo' };
  };

  const sectionInfo = getSectionBadge();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#060913]/90 border-b border-white/[0.07] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/logo.png"
              alt="El Alto Mando TCG"
              width={48}
              height={48}
              className="object-contain drop-shadow-[0_2px_12px_rgba(37,99,235,0.35)]"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                EL ALTO MANDO
              </span>
              <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-md bg-blue-600/15 text-blue-400 border border-blue-500/25">
                TCG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
              <span className="text-slate-300 font-semibold">{sectionInfo.primary}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-blue-500"></span>
              <span>{sectionInfo.secondary}</span>
            </p>
          </div>
        </Link>

        {/* Center Nav / Links: Tienda, Deck Builder, Decks de la Comunidad */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all font-medium ${
              pathname === '/'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
            <span>Tienda</span>
          </Link>

          <Link
            href="/deck-builder"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all font-medium ${
              pathname.startsWith('/deck-builder')
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Deck Builder</span>
          </Link>

          <Link
            href="/decks"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all font-medium ${
              pathname.startsWith('/decks')
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Decks de la Comunidad</span>
          </Link>
        </div>

        {/* Action Buttons: Deck Builder (mobile/tablet), User/Admin & Cart */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/deck-builder"
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-300 bg-blue-950/50 border border-blue-500/30 hover:bg-blue-900/50 transition-all"
            title="Ir al Deck Builder"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Builder</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {(user.role === 'admin' || user.role === 'owner') && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200"
                  title="Panel de Administración"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-900/80 border border-white/[0.08]">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="max-w-[90px] truncate">{user.username}</span>
                <button
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  className="ml-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] transition-all"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Ingresar</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-950/40 border border-blue-500/40 transition-all hover:scale-105 active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-200" />
                <span>Registrarse</span>
              </Link>
            </div>
          )}

          {/* Cart Button */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 border border-blue-400/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="font-semibold hidden sm:inline">Carrito</span>
            {totalCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-white text-slate-950 shadow">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
