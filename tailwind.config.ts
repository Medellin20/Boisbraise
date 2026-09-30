import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette sable commune aux pages publiques, aux portails et à l’administration.
        ink: {
          DEFAULT: 'rgb(var(--ink-default, 57 51 45) / <alpha-value>)',
          50: 'rgb(var(--ink-50, 250 248 244) / <alpha-value>)',
          100: 'rgb(var(--ink-100, 233 226 215) / <alpha-value>)',
          200: 'rgb(var(--ink-200, 213 203 188) / <alpha-value>)',
          300: 'rgb(var(--ink-300, 183 170 151) / <alpha-value>)',
          400: 'rgb(var(--ink-400, 146 131 111) / <alpha-value>)',
          500: 'rgb(var(--ink-500, 112 97 79) / <alpha-value>)',
          600: 'rgb(var(--ink-600, 98 83 63) / <alpha-value>)',
          700: 'rgb(var(--ink-700, 81 68 49) / <alpha-value>)',
          800: 'rgb(var(--ink-800, 68 56 41) / <alpha-value>)',
          900: 'rgb(var(--ink-900, 55 46 36) / <alpha-value>)',
          950: 'rgb(var(--ink-950, 45 38 31) / <alpha-value>)',
        },
        canal: {
          DEFAULT: 'rgb(var(--canal-default, 139 118 88) / <alpha-value>)',
          50: 'rgb(var(--canal-50, 250 247 240) / <alpha-value>)',
          100: 'rgb(var(--canal-100, 238 230 216) / <alpha-value>)',
          200: 'rgb(var(--canal-200, 221 206 183) / <alpha-value>)',
          300: 'rgb(var(--canal-300, 201 181 145) / <alpha-value>)',
          400: 'rgb(var(--canal-400, 173 148 109) / <alpha-value>)',
          500: 'rgb(var(--canal-500, 139 115 80) / <alpha-value>)',
          600: 'rgb(var(--canal-600, 120 96 63) / <alpha-value>)',
          700: 'rgb(var(--canal-700, 100 78 51) / <alpha-value>)',
          800: 'rgb(var(--canal-800, 81 64 44) / <alpha-value>)',
          900: 'rgb(var(--canal-900, 64 50 36) / <alpha-value>)',
        },
        brick: {
          DEFAULT: 'rgb(var(--brick-default, 128 99 68) / <alpha-value>)',
          50: 'rgb(var(--brick-50, 250 245 238) / <alpha-value>)',
          100: 'rgb(var(--brick-100, 240 228 213) / <alpha-value>)',
          200: 'rgb(var(--brick-200, 223 200 172) / <alpha-value>)',
          300: 'rgb(var(--brick-300, 198 167 130) / <alpha-value>)',
          400: 'rgb(var(--brick-400, 172 136 96) / <alpha-value>)',
          500: 'rgb(var(--brick-500, 128 99 68) / <alpha-value>)',
          600: 'rgb(var(--brick-600, 110 82 55) / <alpha-value>)',
          700: 'rgb(var(--brick-700, 92 67 46) / <alpha-value>)',
          800: 'rgb(var(--brick-800, 73 54 37) / <alpha-value>)',
        },
        sand: {
          DEFAULT: 'rgb(var(--sand-default, 246 241 232) / <alpha-value>)',
          50: 'rgb(var(--sand-50, 255 253 248) / <alpha-value>)',
          100: 'rgb(var(--sand-100, 246 241 232) / <alpha-value>)',
          200: 'rgb(var(--sand-200, 236 227 213) / <alpha-value>)',
          300: 'rgb(var(--sand-300, 217 203 183) / <alpha-value>)',
          400: 'rgb(var(--sand-400, 186 170 147) / <alpha-value>)',
        },
        status: {
          available: '#39A78E',
          reserved: '#806344',
          rented: '#6B7280',
          draft: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['var(--font-roboto)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '700' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.14em', fontWeight: '600' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(96,76,49,0.12), 0 1px 2px -1px rgba(57,45,32,0.08)',
        card: '0 8px 24px -8px rgba(96,76,49,0.18), 0 2px 6px -2px rgba(57,45,32,0.08)',
        lifted: '0 22px 48px -14px rgba(57,45,32,0.28)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        float: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        float: 'float 4s ease-in-out infinite',
      },
      backgroundImage: {
        'canal-line':
          'linear-gradient(90deg, transparent, rgba(139,118,88,0.28) 20%, rgba(139,118,88,0.28) 80%, transparent)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
