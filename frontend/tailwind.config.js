/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mauve: '#5d4058',
        gold: '#d4af37',
        goldLight: '#f3e5ab',
        blush: '#fce4ec',
        nude: '#fdfcf8',
        terracotta: '#e88d67',
        rose: '#e6b8b8',
        background: '#fdfcf8',
        surface: '#ffffff',
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#D4AF37',
          600: '#C5A02E',
        },
        text: '#5D4058',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Lato', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-in forwards',
        breathe: 'breathe 6s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        heartbeat: 'heartbeat 3s ease-in-out infinite',
        morph: 'morph 8s ease-in-out infinite',
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        flow: 'flow 3s linear infinite',
        'flow-slow': 'flow 6s linear infinite',
        'flow-slower': 'flow 12s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 10px 30px -10px rgba(93, 64, 88, 0.1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        flow: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' }
        },
        heartbeat: {
          '0%':   { transform: 'scale(1)' },
          '14%':  { transform: 'scale(1.05)' },
          '28%':  { transform: 'scale(1)' },
          '42%':  { transform: 'scale(1.05)' },
          '70%':  { transform: 'scale(1)' },
        },
        morph: {
          '0%':   { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%':  { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }
        }
      }
    },
  },
  plugins: [],
}
