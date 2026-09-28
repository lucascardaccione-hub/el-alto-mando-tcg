import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        altomando: {
          dark: '#080c16',
          surface: '#0f172a',
          card: '#131e36',
          border: '#1e293b',
          blue: {
            DEFAULT: '#0f4c81',
            light: '#2563eb',
            dark: '#0a2540',
            glow: '#3b82f6',
          },
          gold: {
            DEFAULT: '#f59e0b',
            light: '#fbbf24',
            dark: '#b45309',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
