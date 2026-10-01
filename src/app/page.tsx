'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatedHeroTitle } from '@/components/AnimatedHeroTitle';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import CardDetailModal from '@/components/CardDetailModal';
import { CardData } from '@/components/CardItem';
import {
  Sparkles,
  Layers,
  ShoppingBag,
  User,
  ArrowRight,
  ShieldCheck,
  Clock,
  Globe,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Zap,
  TrendingUp,
  Award,
} from 'lucide-react';
import { getDefaultAvatar } from '@/lib/avatars';

export default function HomePage() {
  const router = useRouter();
  const [featuredCards, setFeaturedCards] = useState<CardData[]>([]);
  const [featuredDecks, setFeaturedDecks] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [stats, setStats] = useState({ totalCards: 0, totalStock: 0, totalExpansions: 0 });
  const [trackingCode, setTrackingCode] = useState('');
  const [activeCardModal, setActiveCardModal] = useState<CardData | null>(null);

  useEffect(() => {
    document.title = 'El Alto Mando TCG — Mazos, Tienda & Comunidad Pokémon';

    // Fetch store stats & featured cards
    fetch('/api/expansions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stats) setStats(data.stats);
      })
      .catch(() => {});

    fetch('/api/cards?limit=8&inStockOnly=true')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.cards) setFeaturedCards(data.cards);
      })
      .catch(() => {})
      .finally(() => setLoadingCards(false));

    // Fetch featured community decks
    fetch('/api/decks?filter=public')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.decks) setFeaturedDecks(data.decks.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoadingDecks(false));
  }, []);

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      router.push(`/pedidos?code=${encodeURIComponent(trackingCode.trim())}`);
    } else {
      router.push('/pedidos');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar with the 3 main blocks */}
      <Navbar totalCards={stats.totalCards} totalStock={stats.totalStock} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-white/[0.06]">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] sm:w-[800px] sm:h-[450px] bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-0 right-10 w-72 h-72 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
            {/* Community Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm backdrop-blur-md animate-in fade-in duration-500">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Plataforma Oficial Pokémon TCG Argentina & LATAM</span>
            </div>

            {/* Main Headline */}
            <AnimatedHeroTitle />

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl">
              Tu centro definitivo de <strong className="text-white font-semibold">Mazos competitivos</strong>,{' '}
              <strong className="text-white font-semibold">Tienda de singles</strong> en tiempo real y{' '}
              <strong className="text-white font-semibold">Comunidad de entrenadores</strong>.
            </p>

            {/* Quick 3-Block CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4 w-full">
              {/* Mazos CTA — Greninja */}
              <Link
                href="/deck-builder"
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 shadow-xl shadow-blue-900/40 border border-blue-400/40 transition-all hover:scale-105 active:scale-95"
              >
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/658.png" alt="Greninja" className="w-6 h-6 object-contain drop-shadow-md" />
                <span>Mazos</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
              </Link>

              {/* Tienda CTA — Alakazam */}
              <Link
                href="/tienda"
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/40 hover:border-amber-500 shadow-lg shadow-amber-950/30 transition-all hover:scale-105 active:scale-95"
              >
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/65.png" alt="Alakazam" className="w-6 h-6 object-contain drop-shadow-md" />
                <span>Tienda</span>
              </Link>

              {/* Mi Cuenta CTA — Lucario */}
              <Link
                href="/perfil"
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all hover:scale-105 active:scale-95"
              >
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png" alt="Lucario" className="w-6 h-6 object-contain drop-shadow-md" />
                <span>Mi Cuenta</span>
              </Link>
            </div>

            {/* Fast Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 w-full max-w-3xl">
              <div className="bg-[#0b1124]/80 border border-white/[0.08] rounded-2xl p-3.5 text-center">
                <span className="text-xl sm:text-2xl font-black text-white block">
                  {stats.totalCards || '500+'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Cartas en Catálogo</span>
              </div>
              <div className="bg-[#0b1124]/80 border border-white/[0.08] rounded-2xl p-3.5 text-center">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block">
                  {stats.totalStock || '1,200+'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Stock en Vivo</span>
              </div>
              <div className="bg-[#0b1124]/80 border border-white/[0.08] rounded-2xl p-3.5 text-center">
                <span className="text-xl sm:text-2xl font-black text-blue-400 block">PTCGL</span>
                <span className="text-[11px] text-slate-400 font-medium">Formato Estándar</span>
              </div>
              <div className="bg-[#0b1124]/80 border border-white/[0.08] rounded-2xl p-3.5 text-center">
                <span className="text-xl sm:text-2xl font-black text-amber-400 block">100%</span>
                <span className="text-[11px] text-slate-400 font-medium">Vendedores Reales</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOS 3 BLOQUES PRINCIPALES */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Estructura de la Plataforma
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Los 3 Bloques del Alto Mando
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Todo lo que necesitas para tu juego competitivo y colección, organizado de forma simple y potente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* BLOQUE 1: MAZOS — Greninja */}
          <div className="relative group rounded-3xl bg-gradient-to-b from-[#0d1630]/90 to-[#080d1e]/90 border border-blue-500/25 p-7 sm:p-8 flex flex-col justify-between shadow-xl hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-600/25 transition-all duration-500 overflow-hidden">
            {/* Pokémon Mascot: Greninja */}
            <div className="absolute -right-4 -top-2 w-44 h-44 sm:w-52 sm:h-52 pointer-events-none select-none z-0">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl scale-75 group-hover:scale-100 group-hover:bg-blue-400/30 transition-all duration-700" />
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png"
                alt="Greninja"
                className="relative w-full h-full object-contain drop-shadow-[0_8px_30px_rgba(59,130,246,0.45)] transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-110 group-hover:drop-shadow-[0_12px_40px_rgba(59,130,246,0.7)] group-hover:brightness-110"
              />
            </div>

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 group-hover:border-blue-400/50 transition-all duration-300">
                  <Layers className="w-6 h-6" />
                </div>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/658.png" alt="Greninja" className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors duration-300">
                  Mazos
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-[75%]">
                  Creación, importación y estudio del metagame competitivo con validación oficial PTCGL.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <Link
                  href="/deck-builder"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-blue-950/50 border border-slate-800/80 hover:border-blue-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Deck Builder (Creador)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  href="/decks?tab=community"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-800/80 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Decks de la Comunidad</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  href="/decks?tab=my"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/50 border border-slate-800/80 hover:border-indigo-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mis Mazos Guardados</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <Link
                href="/deck-builder"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/40 transition-all hover:shadow-lg hover:shadow-blue-800/50"
              >
                <span>Armar Mi Mazo Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* BLOQUE 2: TIENDA — Alakazam */}
          <div className="relative group rounded-3xl bg-gradient-to-b from-[#1c160c]/90 to-[#0e0c07]/90 border border-amber-500/25 p-7 sm:p-8 flex flex-col justify-between shadow-xl hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-600/25 transition-all duration-500 overflow-hidden">
            {/* Pokémon Mascot: Alakazam */}
            <div className="absolute -right-4 -top-2 w-44 h-44 sm:w-52 sm:h-52 pointer-events-none select-none z-0">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl scale-75 group-hover:scale-100 group-hover:bg-amber-400/30 transition-all duration-700" />
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png"
                alt="Alakazam"
                className="relative w-full h-full object-contain drop-shadow-[0_8px_30px_rgba(245,158,11,0.45)] transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-110 group-hover:drop-shadow-[0_12px_40px_rgba(245,158,11,0.7)] group-hover:brightness-110"
              />
            </div>

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-600/30 group-hover:border-amber-400/50 transition-all duration-300">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/65.png" alt="Alakazam" className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors duration-300">
                  Tienda
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-[75%]">
                  Catálogo de cartas sueltas con stock verificado, precios claros y seguimiento en vivo.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <Link
                  href="/tienda"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-950/50 border border-slate-800/80 hover:border-amber-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Catálogo de Singles & Filtros</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  href="/pedidos"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-blue-950/50 border border-slate-800/80 hover:border-blue-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Seguimiento de Pedidos</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vendedores Verificados</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">100% Directo</span>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <Link
                href="/tienda"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-amber-100 bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-900/40 transition-all hover:shadow-lg hover:shadow-amber-800/50"
              >
                <span>Explorar la Tienda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* BLOQUE 3: MI CUENTA — Lucario */}
          <div className="relative group rounded-3xl bg-gradient-to-b from-[#180f2c]/90 to-[#0b0717]/90 border border-violet-500/25 p-7 sm:p-8 flex flex-col justify-between shadow-xl hover:border-violet-400/60 hover:shadow-2xl hover:shadow-violet-600/25 transition-all duration-500 overflow-hidden">
            {/* Pokémon Mascot: Lucario */}
            <div className="absolute -right-4 -top-2 w-44 h-44 sm:w-52 sm:h-52 pointer-events-none select-none z-0">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-3xl scale-75 group-hover:scale-100 group-hover:bg-violet-400/30 transition-all duration-700" />
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png"
                alt="Lucario"
                className="relative w-full h-full object-contain drop-shadow-[0_8px_30px_rgba(139,92,246,0.45)] transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-110 group-hover:drop-shadow-[0_12px_40px_rgba(139,92,246,0.7)] group-hover:brightness-110"
              />
            </div>

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:bg-violet-600/30 group-hover:border-violet-400/50 transition-all duration-300">
                  <User className="w-6 h-6" />
                </div>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png" alt="Lucario" className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(139,92,246,0.5)] group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white group-hover:text-violet-300 transition-colors duration-300">
                  Mi Cuenta
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-[75%]">
                  Tu perfil de entrenador Pokémon: avatar, pedidos realizados y mazos guardados.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <Link
                  href="/perfil"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-violet-950/50 border border-slate-800/80 hover:border-violet-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-violet-400" />
                    <span>Mi Perfil & Avatar</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  href="/pedidos"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-950/50 border border-slate-800/80 hover:border-amber-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mis Compras & Pedidos</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  href="/admin"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-800/80 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Panel de Control (Vendedor / Admin)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <Link
                href="/perfil"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-900/40 transition-all hover:shadow-lg hover:shadow-violet-800/50"
              >
                <span>Acceder a Mi Cuenta</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN PREVIEW: CARTAS DESTACADAS EN TIENDA */}
      <section className="py-12 border-t border-white/[0.06] bg-[#070b16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Tienda Oficial</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Últimas Cartas Ingresadas en Stock
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Cartas individuales listas para comprar y agregar a tus mazos.
              </p>
            </div>

            <Link
              href="/tienda"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors group"
            >
              <span>Ver todas las cartas en la Tienda</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingCards ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 aspect-[2.5/3.5] animate-pulse"
                />
              ))}
            </div>
          ) : featuredCards.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No hay cartas disponibles de momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setActiveCardModal(card)}
                  className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 p-3 sm:p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"
                >
                  <div className="relative aspect-[2.5/3.5] w-full rounded-xl overflow-hidden bg-slate-950 mb-3">
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-300">
                      ${card.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                      {card.name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">{card.expansion}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Stock: {card.stock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN PREVIEW: DECKS DE LA COMUNIDAD */}
      {featuredDecks.length > 0 && (
        <section className="py-12 border-t border-white/[0.06] bg-[#060913]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Metagame & Comunidad</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Decks Destacados de Jugadores
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Explorá listas compartidas por la comunidad y clonálas a tu cuenta.
                </p>
              </div>

              <Link
                href="/decks?tab=community"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors group"
              >
                <span>Ver todos los Decks</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredDecks.map((deck) => (
                <Link
                  key={deck.id}
                  href={`/deck-builder/${deck.id}`}
                  className="group rounded-2xl bg-[#0a0f20]/80 border border-slate-800 hover:border-blue-500/50 p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/5">
                      {deck.cover_card_image ? (
                        <img
                          src={deck.cover_card_image}
                          alt={deck.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Layers className="w-8 h-8 text-slate-600" />
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-blue-300">
                        {deck.total_cards || 60} Cartas
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                        {deck.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-800">
                          <img
                            src={deck.author_avatar || getDefaultAvatar(deck.author_name || 'User')}
                            alt={deck.author_name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="truncate">{deck.author_name || 'Comunidad'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-semibold">Formato Estándar</span>
                    <span className="group-hover:text-blue-400 transition-colors font-semibold flex items-center gap-1">
                      Ver mazo <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BANNER SEGUIMIENTO DE PEDIDOS */}
      <section className="py-14 border-t border-white/[0.06] bg-gradient-to-b from-[#0a1024] to-[#060913]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Clock className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              ¿Ya hiciste una compra en la Tienda?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Ingresa el código único de tu pedido (ej: <strong className="text-amber-400 font-mono">EAM-12345</strong>) para consultar el estado en tiempo real.
            </p>
          </div>

          <form onSubmit={handleTrackingSubmit} className="max-w-md mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="EAM-XXXXX"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/40 transition-all hover:scale-105 active:scale-95"
            >
              Rastrear
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#04060d] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white">EL ALTO MANDO</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400">
                  TCG
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Comunidad competitiva y coleccionismo de Pokémon TCG en Argentina y Latinoamérica.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Bloque Mazos
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <Link href="/deck-builder" className="hover:text-white transition-colors">
                    Deck Builder Oficial
                  </Link>
                </li>
                <li>
                  <Link href="/decks?tab=community" className="hover:text-white transition-colors">
                    Decks de la Comunidad
                  </Link>
                </li>
                <li>
                  <Link href="/decks?tab=my" className="hover:text-white transition-colors">
                    Mis Mazos Guardados
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Bloque Tienda
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <Link href="/tienda" className="hover:text-white transition-colors">
                    Catálogo de Singles
                  </Link>
                </li>
                <li>
                  <Link href="/pedidos" className="hover:text-white transition-colors">
                    Seguimiento de Pedidos
                  </Link>
                </li>
                <li>
                  <Link href="/tienda" className="hover:text-white transition-colors">
                    Stock en Tiempo Real
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Bloque Mi Cuenta
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <Link href="/perfil" className="hover:text-white transition-colors">
                    Mi Perfil de Entrenador
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Crear Cuenta de Jugador
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 text-center space-y-2 text-[11px]">
            <p className="font-semibold text-slate-400">
              El Alto Mando TCG © {new Date().getFullYear()} — Diseñado para la comunidad de Pokémon TCG
            </p>
            <p className="text-slate-600">
              Pokémon y sus marcas son propiedad registrada de Nintendo, Creatures Inc. y Game Freak. Este es un sitio comunitario sin afiliación oficial con Nintendo ni The Pokémon Company.
            </p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer & Card Modal */}
      <CartDrawer />
      <CardDetailModal card={activeCardModal} onClose={() => setActiveCardModal(null)} />
    </div>
  );
}
