import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'El Alto Mando TCG — Catálogo y Stock Oficial de Cartas Pokémon',
  description: 'Catálogo oficial de cartas Pokémon TCG de El Alto Mando. Encuentra singles, holos, secret rares y gestiona tu stock en tiempo real.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
