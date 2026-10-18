import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://elaltomandotcg.vercel.app'),
  title: {
    default: 'El Alto Mando TCG — Mazos, Singles y Comunidad Pokémon TCG',
    template: '%s — El Alto Mando TCG',
  },
  description: 'Marketplace comunitario de cartas sueltas Pokémon TCG y Deck Builder competitivo de El Alto Mando en Argentina y LATAM. Encuentra singles, holos, secret rares y arma tus mazos en formato estándar.',
  openGraph: {
    title: 'El Alto Mando TCG — Mazos, Singles y Comunidad Pokémon TCG',
    description: 'Marketplace comunitario de cartas sueltas Pokémon TCG y Deck Builder competitivo en Argentina y LATAM.',
    url: 'https://elaltomandotcg.vercel.app',
    siteName: 'El Alto Mando TCG',
    locale: 'es_AR',
    type: 'website',
  },
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
    <html lang="es" className={`${plusJakartaSans.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('eam_theme');
                if (saved === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[99999] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-blue-600 focus:text-white focus:font-bold focus:text-xs focus:shadow-xl"
        >
          Saltar al contenido principal
        </a>
        <ThemeProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
