'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  ShieldCheck,
  Layers,
  Sparkles,
  User,
  UserPlus,
  LogOut,
  Clock,
  ChevronDown,
  Menu,
  X,
  PlusCircle,
  Globe,
  LayoutDashboard,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getRoleBadge, canAccessAdmin } from '@/lib/roles';
import { getDefaultAvatar } from '@/lib/avatars';

interface NavbarProps {
  totalCards?: number;
  totalStock?: number;
}

interface UserSession {
  id: number;
  username: string;
  role: string;
  email?: string;
  avatar_url?: string;
  is_verified?: number;
}

export default function Navbar({ totalCards = 0, totalStock = 0 }: NavbarProps) {
  const { totalCount, openCart } = useCart();
  const [user, setUser] = useState<UserSession | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname() || '/';

  // Dropdown states
  const [mazosOpen, setMazosOpen] = useState(false);
  const [tiendaOpen, setTiendaOpen] = useState(false);
  const [cuentaOpen, setCuentaOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mazosRef = useRef<HTMLDivElement>(null);
  const tiendaRef = useRef<HTMLDivElement>(null);
  const cuentaRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mazosRef.current && !mazosRef.current.contains(event.target as Node)) {
        setMazosOpen(false);
      }
      if (tiendaRef.current && !tiendaRef.current.contains(event.target as Node)) {
        setTiendaOpen(false);
      }
      if (cuentaRef.current && !cuentaRef.current.contains(event.target as Node)) {
        setCuentaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMazosOpen(false);
    setTiendaOpen(false);
    setCuentaOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const getSectionBadge = () => {
    if (pathname.startsWith('/tienda')) {
      return { primary: 'Tienda Oficial', secondary: 'Stock en Vivo' };
    }
    if (pathname.startsWith('/deck-builder')) {
      return { primary: 'Deck Builder', secondary: 'Creador de Mazos' };
    }
    if (pathname.startsWith('/decks')) {
      return { primary: 'Decks de la Comunidad', secondary: 'Metagame Oficial' };
    }
    if (pathname.startsWith('/pedidos')) {
      return { primary: 'Seguimiento', secondary: 'Estado de Pedidos' };
    }
    if (pathname.startsWith('/admin')) {
      return { primary: 'Panel de Control', secondary: 'Administración' };
    }
    if (pathname.startsWith('/perfil')) {
      return { primary: 'Mi Perfil', secondary: 'Panel de Entrenador' };
    }
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/recuperar-contrasena')
    ) {
      return { primary: 'Mi Cuenta', secondary: 'El Alto Mando' };
    }
    return { primary: 'Inicio', secondary: 'El Alto Mando TCG' };
  };

  const sectionInfo = getSectionBadge();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
          if (canAccessAdmin(data.user)) {
            fetch('/api/orders/unread-count')
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => {
                if (d?.unreadCount) setUnreadCount(d.unreadCount);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !canAccessAdmin(user)) return;
    const interval = setInterval(() => {
      fetch('/api/orders/unread-count')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          setUnreadCount(d?.unreadCount || 0);
        })
        .catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch {
      // ignore
    }
  };

  const isMazosActive = pathname.startsWith('/deck-builder') || pathname.startsWith('/decks');
  const isTiendaActive = pathname.startsWith('/tienda') || pathname.startsWith('/pedidos');
  const isCuentaActive = pathname.startsWith('/perfil') || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#060913]/95 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3.5 group flex-shrink-0">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-2xl overflow-hidden bg-white p-1 border border-white/20 shadow-md shadow-blue-500/15 group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/logo.png"
              alt="El Alto Mando TCG"
              width={46}
              height={46}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-slate-200 transition-colors">
                EL ALTO MANDO
              </span>
              <span className="text-[10px] font-black tracking-widest px-1.5 sm:px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border border-yellow-300 shadow-sm shadow-amber-500/40">
                TCG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
              <span className="text-slate-300 font-semibold">{sectionInfo.primary}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-amber-400"></span>
              <span className="truncate max-w-[130px] sm:max-w-none">{sectionInfo.secondary}</span>
            </p>
          </div>
        </Link>

        {/* Desktop Navigation: 3 Main Blocks (Mazos, Tienda, Mi Cuenta) + Inicio */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold">
          {/* Inicio Link */}
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              pathname === '/'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <span>Inicio</span>
          </Link>

          {/* BLOQUE 1: MAZOS */}
          <div className="relative" ref={mazosRef}>
            <button
              onClick={() => {
                setMazosOpen(!mazosOpen);
                setTiendaOpen(false);
                setCuentaOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                isMazosActive
                  ? 'bg-blue-600/25 text-blue-300 border border-blue-500/50 shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Mazos</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${mazosOpen ? 'rotate-180' : ''}`} />
            </button>

            {mazosOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-[#090e1c] border border-blue-500/20 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                  Módulo de Mazos & Metagame
                </div>
                <Link
                  href="/deck-builder"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-blue-950/40 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-900/40 text-blue-400 group-hover:bg-blue-800/60">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Deck Builder</div>
                    <div className="text-[10px] text-slate-400">Creador y validador Estándar</div>
                  </div>
                </Link>
                <Link
                  href="/decks?tab=community"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-emerald-950/40 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-900/40 text-emerald-400 group-hover:bg-emerald-800/60">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Decks de la Comunidad</div>
                    <div className="text-[10px] text-slate-400">Arquetipos y listas públicas</div>
                  </div>
                </Link>
                <Link
                  href="/decks?tab=my"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-indigo-950/40 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-900/40 text-indigo-400 group-hover:bg-indigo-800/60">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Mis Mazos Guardados</div>
                    <div className="text-[10px] text-slate-400">Tus listas personales</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* BLOQUE 2: TIENDA */}
          <div className="relative" ref={tiendaRef}>
            <button
              onClick={() => {
                setTiendaOpen(!tiendaOpen);
                setMazosOpen(false);
                setCuentaOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                isTiendaActive
                  ? 'bg-blue-600/25 text-blue-300 border border-blue-500/50 shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Tienda</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${tiendaOpen ? 'rotate-180' : ''}`} />
            </button>

            {tiendaOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-[#090e1c] border border-amber-500/20 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                  Catálogo & Compras
                </div>
                <Link
                  href="/tienda"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-amber-950/40 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-amber-900/40 text-amber-400 group-hover:bg-amber-800/60">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Catálogo de Singles</div>
                    <div className="text-[10px] text-slate-400">Cartas sueltas y stock en vivo</div>
                  </div>
                </Link>
                <Link
                  href="/pedidos"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-blue-950/40 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-900/40 text-blue-400 group-hover:bg-blue-800/60">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Seguimiento de Pedidos</div>
                    <div className="text-[10px] text-slate-400">Rastreá tu pedido con código EAM</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side: BLOQUE 3 (MI CUENTA) + CARRITO + MOBILE BUTTON */}
        <div className="flex items-center gap-2.5">
          {/* Admin Order Alerts */}
          {user && canAccessAdmin(user) && unreadCount > 0 && (
            <Link
              href="/admin/orders"
              className="animate-pulse flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-lg shadow-rose-950/60 border border-amber-400/50 hover:scale-105 transition-all"
              title="¡Tienes nuevos pedidos pendientes de revisión!"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pedidos</span> ({unreadCount})
            </Link>
          )}

          {/* BLOQUE 3: MI CUENTA (Dropdown) */}
          <div className="relative" ref={cuentaRef}>
            {user ? (
              <button
                onClick={() => {
                  setCuentaOpen(!cuentaOpen);
                  setMazosOpen(false);
                  setTiendaOpen(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-2xl text-xs font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border transition-all ${
                  isCuentaActive || cuentaOpen
                    ? 'border-blue-500/60 shadow-md shadow-blue-900/20'
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                }`}
                title="Mi Cuenta"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-white/20 flex-shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src={user.avatar_url || getDefaultAvatar(user.username)}
                    alt={user.username}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getDefaultAvatar(user.username);
                    }}
                  />
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight max-w-[90px]">
                  <span className="font-bold text-white truncate text-[11px]">
                    {user.username}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 truncate">
                    {getRoleBadge(user).label}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${cuentaOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] transition-all"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mi Cuenta</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-950/40 border border-blue-500/40 transition-all hover:scale-105 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-200" />
                  <span>Registro</span>
                </Link>
              </div>
            )}

            {/* Dropdown for Logged User */}
            {cuentaOpen && user && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-[#090e1c] border border-blue-500/20 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                  <div className="font-bold text-sm text-white flex items-center justify-between">
                    <span>{user.username}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                      {getRoleBadge(user).label}
                    </span>
                  </div>
                  {user.email && (
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</div>
                  )}
                </div>

                <Link
                  href="/perfil"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-blue-950/40 transition-colors"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold">Mi Perfil & Contraseña</span>
                </Link>

                <Link
                  href="/decks?tab=my"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-indigo-950/40 transition-colors"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold">Mis Mazos Guardados</span>
                </Link>

                <Link
                  href="/pedidos"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-amber-950/40 transition-colors"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold">Seguimiento de Pedidos</span>
                </Link>

                {canAccessAdmin(user) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-950/40 border border-emerald-800/30 transition-colors my-1"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">
                      {user.role === 'seller' || user.role === 'vendedor' ? 'Panel de Vendedor' : 'Panel de Admin (Luca)'}
                    </span>
                  </Link>
                )}

                <div className="border-t border-slate-800/80 my-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors text-left text-xs font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 border border-blue-400/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            title="Ver carrito de compras"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            {totalCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-white text-slate-950 shadow">
                {totalCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-white/[0.08]"
            title="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (3 Blocks) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070c18] border-b border-white/[0.08] p-4 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          {/* Quick Home link */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <Link
              href="/"
              className={`text-sm font-bold flex items-center gap-2 ${
                pathname === '/' ? 'text-blue-400' : 'text-slate-300'
              }`}
            >
              <span>🏠 Inicio</span>
            </Link>
          </div>

          {/* BLOQUE 1: MAZOS */}
          <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Bloque 1: Mazos</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <Link
                href="/deck-builder"
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-800 text-slate-200"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Deck Builder (Creador de Mazos)</span>
              </Link>
              <Link
                href="/decks?tab=community"
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-800 text-slate-200"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Decks de la Comunidad</span>
              </Link>
              <Link
                href="/decks?tab=my"
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-800 text-slate-200"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Mis Mazos Guardados</span>
              </Link>
            </div>
          </div>

          {/* BLOQUE 2: TIENDA */}
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bloque 2: Tienda</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <Link
                href="/tienda"
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-800 text-slate-200"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Catálogo de Singles & Stock</span>
              </Link>
              <Link
                href="/pedidos"
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-800 text-slate-200"
              >
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Seguimiento de Pedidos</span>
              </Link>
            </div>
          </div>

          {/* BLOQUE 3: MI CUENTA */}
          <div className="bg-slate-900/60 border border-violet-500/20 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>Bloque 3: Mi Cuenta</span>
            </div>
            {user ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-900 border border-white/20">
                    <img
                      src={user.avatar_url || getDefaultAvatar(user.username)}
                      alt={user.username}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{user.username}</span>
                    <span className="text-[10px] text-slate-400">{getRoleBadge(user).label}</span>
                  </div>
                </div>

                <Link
                  href="/perfil"
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-800 text-slate-200"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Mi Perfil de Entrenador</span>
                </Link>

                {canAccessAdmin(user) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-800 text-emerald-300 font-bold"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Panel de Control (Admin/Ventas)</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-rose-950/40 text-rose-300 font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/login"
                  className="flex-1 py-2 text-center rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-white/10"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="flex-1 py-2 text-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-950/40"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
