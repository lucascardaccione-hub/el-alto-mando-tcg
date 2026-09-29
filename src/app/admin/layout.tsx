'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Users,
  ShoppingBag,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadOrders, setUnreadOrders] = useState(0);

  // If already on login page, render children directly
  const isLoginPage = pathname === '/admin/login';

  const fetchUnread = async () => {
    try {
      const res = await fetch('/api/orders/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadOrders(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          router.push('/admin/login');
        }
      } catch (e) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [isLoginPage, router]);

  useEffect(() => {
    if (!currentUser) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    // If the seller is on the orders page, reset unread count
    if (pathname === '/admin/orders') {
      fetch('/api/orders/unread-count', { method: 'POST' })
        .then(() => setUnreadOrders(0))
        .catch(() => {});
    }
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Verificando credenciales de acceso...</p>
      </div>
    );
  }

  const isLuca = currentUser?.username?.toLowerCase() === 'luca';

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, isPulsing: false },
    {
      href: '/admin/orders',
      label: unreadOrders > 0 ? `Pedidos (${unreadOrders})` : 'Pedidos',
      icon: ShoppingBag,
      isPulsing: unreadOrders > 0,
    },
    { href: '/admin/new', label: 'Cargar Cartas', icon: PlusCircle, isPulsing: false },
    { href: '/admin/inventory', label: 'Inventario y Stock', icon: Package, isPulsing: false },
    ...(isLuca ? [{ href: '/admin/users', label: 'Usuarios Habilitados', icon: Users, isPulsing: false }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col text-slate-100">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-[#0d1629]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 aspect-square flex-shrink-0 rounded-full overflow-hidden p-0.5 bg-gradient-to-br from-blue-600 to-amber-500">
                <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center p-0.5">
                  <Image
                    src="/logo.png"
                    alt="El Alto Mando"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm text-white tracking-tight">EL ALTO MANDO</span>
                <span className="ml-1.5 text-[10px] font-bold px-1 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ADMIN
                </span>
              </div>
            </Link>

            {/* Nav tabs desktop */}
            <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-slate-800 pl-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      link.isPulsing
                        ? 'animate-pulse bg-gradient-to-r from-amber-600/30 to-rose-600/30 text-amber-300 border border-amber-500/60 shadow-lg shadow-amber-950/50 font-bold'
                        : isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${link.isPulsing ? 'text-amber-400' : ''}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 text-xs">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Admin: <strong className="text-white">{currentUser.username}</strong>
                </span>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Tienda</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav row */}
        <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-800/80 bg-slate-900/90 text-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
                  link.isPulsing
                    ? 'animate-pulse text-amber-300 font-extrabold'
                    : isActive
                    ? 'text-blue-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 ${link.isPulsing ? 'text-amber-400' : ''}`} />
                <span className="text-[10px]">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
