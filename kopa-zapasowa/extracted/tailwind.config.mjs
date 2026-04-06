/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nude: '#F8F1EB',
        blush: '#EFD9D1',
        rose: '#E7C8C8',
        mauve: '#5D4058',
        gold: '#D4AF37',
        goldLight: '#F4E2A1',
        terracotta: '#E88D67',
        surface: '#F7F3F0',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Lato', 'sans-serif'],
      },
      fontSize: {
        'fs-label': ['clamp(0.8125rem, 0.79rem + 0.12vw, 0.875rem)', { lineHeight: '1.35' }],
        'fs-ui': ['clamp(0.875rem, 0.85rem + 0.12vw, 0.9375rem)', { lineHeight: '1.45' }],
        'fs-body': ['clamp(0.9375rem, 0.91rem + 0.2vw, 1.0625rem)', { lineHeight: '1.65' }],
        'fs-body-lg': ['clamp(1.0625rem, 1rem + 0.35vw, 1.1875rem)', { lineHeight: '1.7' }],
        'fs-title-sm': ['clamp(1.25rem, 1.12rem + 0.55vw, 1.5rem)', { lineHeight: '1.25' }],
        'fs-title-md': ['clamp(1.5rem, 1.28rem + 0.95vw, 2rem)', { lineHeight: '1.18' }],
        'fs-title-lg': ['clamp(1.875rem, 1.5rem + 1.6vw, 3rem)', { lineHeight: '1.1' }],
        'fs-title-xl': ['clamp(2.25rem, 1.75rem + 2.2vw, 3.75rem)', { lineHeight: '1.02' }],
        'fs-display': ['clamp(2.75rem, 1.9rem + 3.3vw, 4.5rem)', { lineHeight: '0.95' }],
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.05)' },
          '40%': { transform: 'scale(0.98)' },
          '60%': { transform: 'scale(1.04)' },
        },
        morph: {
          '0%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
        },
        flow: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        flowVeinGold: {
          '0%': { strokeDashoffset: '600', opacity: '0.3' },
          '30%': { opacity: '0.8' },
          '60%': { opacity: '0.5' },
          '100%': { strokeDashoffset: '0', opacity: '0.3' },
        },
        flowVeinRose: {
          '0%': { strokeDashoffset: '0', opacity: '0.25' },
          '40%': { opacity: '0.6' },
          '100%': { strokeDashoffset: '-800', opacity: '0.25' },
        },
      },
      animation: {
        breathe: 'breathe 8s ease-in-out infinite',
        float: 'float 8s ease-in-out infinite',
        'pulse-slow': 'breathe 10s ease-in-out infinite',
        heartbeat: 'heartbeat 3.6s ease-in-out infinite',
        morph: 'morph 8s ease-in-out infinite',
        flow: 'flow 3s linear infinite',
        'flow-slow': 'flow 6s linear infinite',
        'flow-slower': 'flow 12s linear infinite',
        'flow-vein-gold': 'flowVeinGold 8s ease-in-out infinite',
        'flow-vein-rose': 'flowVeinRose 12s ease-in-out infinite',
      },
      boxShadow: {
        soft: '0 20px 70px -35px rgba(93, 64, 88, 0.4)',
      },
    },
  },
  plugins: [],
};