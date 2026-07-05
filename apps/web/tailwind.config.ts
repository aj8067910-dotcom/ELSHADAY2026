import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // tema escuro elegante: preto + grafite + dourado
        ink: {
          950: '#08080a',
          900: '#0d0d10',
          800: '#141418',
          700: '#1c1c22',
          600: '#26262e',
          500: '#34343e',
        },
        // lilás — cor predominante do grupo
        brand: {
          300: '#D6BCFA',
          400: '#B794F4',
          500: '#9F7AEA',
          600: '#805AD5',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        glow: '0 0 40px rgba(159, 122, 234, 0.20)',
        card: '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #D6BCFA 0%, #9F7AEA 45%, #805AD5 100%)',
        'radial-fade':
          'radial-gradient(ellipse at top, rgba(159,122,234,0.10), transparent 55%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
