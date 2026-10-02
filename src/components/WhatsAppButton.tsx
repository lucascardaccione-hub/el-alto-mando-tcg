'use client';

import React, { useState } from 'react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/LN5CrA0S9UEEHxrsamuNyD?s=cl&p=a&mlu=4';

export function WhatsAppSvgIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.82 12.04 21.82C17.5 21.82 21.96 17.37 21.96 11.91C21.96 6.45 17.5 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.49 3.68 12.04 3.68C16.58 3.68 20.28 7.37 20.28 11.91C20.28 16.45 16.59 20.15 12.04 20.15ZM16.56 14.39C16.31 14.26 15.09 13.66 14.86 13.58C14.64 13.5 14.47 13.46 14.31 13.71C14.14 13.96 13.67 14.51 13.53 14.68C13.38 14.85 13.24 14.87 12.99 14.75C12.74 14.62 11.94 14.36 10.99 13.51C10.25 12.85 9.75 12.04 9.61 11.79C9.46 11.54 9.59 11.41 9.72 11.28C9.83 11.17 9.97 10.99 10.09 10.84C10.22 10.7 10.26 10.59 10.34 10.43C10.43 10.26 10.38 10.12 10.32 10C10.26 9.87 9.76 8.65 9.56 8.14C9.36 7.65 9.15 7.72 9 7.71C8.86 7.7 8.7 7.7 8.53 7.7C8.36 7.7 8.09 7.76 7.86 8.01C7.63 8.26 7 8.85 7 10.06C7 11.27 7.88 12.44 8.01 12.61C8.13 12.77 9.74 15.26 12.21 16.33C12.8 16.58 13.25 16.73 13.61 16.85C14.2 17.04 14.74 17.01 15.17 16.95C15.65 16.88 16.64 16.35 16.85 15.77C17.05 15.18 17.05 14.68 16.99 14.58C16.93 14.47 16.81 14.51 16.56 14.39Z" />
    </svg>
  );
}

interface WhatsAppHeroButtonProps {
  className?: string;
  showSubtitle?: boolean;
}

export function WhatsAppHeroButton({ className = '', showSubtitle = false }: WhatsAppHeroButtonProps) {
  return (
    <a
      href={WHATSAPP_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:via-green-500 hover:to-emerald-600 shadow-xl shadow-emerald-950/40 border border-emerald-400/50 hover:border-emerald-300 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] overflow-visible cursor-pointer ${className}`}
      title="Unirse al grupo oficial de WhatsApp de El Alto Mando TCG"
    >
      {/* Pikachu Sprite matching Greninja, Alakazam & Lucario pixel sprite style */}
      <div className="relative flex items-center justify-center">
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
          alt="Pikachu"
          className="w-6 h-6 object-contain drop-shadow-md transition-all duration-300 transform group-hover:-translate-y-1.5 group-hover:scale-125 group-hover:rotate-6 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] pointer-events-none"
        />
        {/* Electric spark on hover */}
        <span className="absolute -top-2.5 -right-2 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none select-none drop-shadow-[0_0_6px_rgba(250,204,21,1)]">
          ⚡
        </span>
      </div>

      {/* WhatsApp Logo with gentle tilt on hover */}
      <div className="w-5 h-5 rounded-full bg-white text-[#25D366] flex items-center justify-center p-0.5 shadow-md shadow-emerald-950/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12 flex-shrink-0">
        <WhatsAppSvgIcon className="w-3.5 h-3.5 fill-[#25D366]" />
      </div>

      {/* Button Text */}
      <div className="flex flex-col text-left leading-none">
        {showSubtitle && (
          <span className="text-[9px] uppercase tracking-wider text-emerald-200 font-semibold mb-0.5">
            Comunidad
          </span>
        )}
        <span className="whitespace-nowrap tracking-wide group-hover:text-emerald-100 transition-colors">
          Grupo WhatsApp
        </span>
      </div>

      {/* External indicator icon */}
      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-200 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white flex-shrink-0" />
    </a>
  );
}

export function WhatsAppFloatingButton() {
  return (
    <aside aria-label="Comunidad WhatsApp" className="fixed bottom-6 right-6 z-40">
      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white shadow-2xl shadow-emerald-950/60 border border-emerald-400/50 hover:border-emerald-300 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer"
        title="¡Unite al grupo de WhatsApp de la comunidad!"
      >
        {/* Pikachu with hover bounce & electric spark */}
        <div className="relative flex items-center justify-center">
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
            alt="Pikachu"
            className="w-6 h-6 object-contain drop-shadow-md transition-all duration-300 transform group-hover:-translate-y-1.5 group-hover:scale-125 group-hover:rotate-6 pointer-events-none"
          />
          <span className="absolute -top-2 -right-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
            ⚡
          </span>
        </div>

        {/* WhatsApp Icon */}
        <div className="w-5 h-5 rounded-full bg-white text-[#25D366] flex items-center justify-center p-0.5 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12">
          <WhatsAppSvgIcon className="w-3.5 h-3.5 fill-[#25D366]" />
        </div>

        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">
            Comunidad
          </span>
          <span className="text-xs font-black tracking-wide">
            WhatsApp
          </span>
        </div>
      </a>
    </aside>
  );
}
