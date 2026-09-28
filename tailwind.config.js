/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#fbf7f5',
          900: '#f5efe9',
          800: '#ecdccf',
          700: '#e0c7b6',
          600: '#c9a188',
          500: '#a8795a',
        },
        gold: {
          300: '#e6d6c8',
          400: '#d1bfa9',
          500: '#b89278',
          600: '#8f6647',
          700: '#6b4932',
        },
        platinum: {
          100: '#3b2a21',
          200: '#5a3f32',
          300: '#7a5543',
          400: '#9b6f55',
          500: '#b38a6b',
        },
        slate: {
          50: '#fbf7f5',
          100: '#f8efe9',
          200: '#e9d9cc',
          300: '#ddc6b3',
          400: '#caa188',
          500: '#a8795a',
          600: '#8a5e44',
          700: '#6b4330',
          800: '#4a2f20',
          900: '#2b160a',
          950: '#1b0f08',
        },
        // emerald: {
        //   400: '#4d8a7d',
        //   500: '#2f6b61',
        // },
        crimson: {
          400: '#b86a4e',
          500: '#8f4b36',
        },
        sapphire: {
          400: '#a1887a',
          500: '#7a5f4e',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #5f7f8b 0%, #b7c9cf 50%, #355664 100%)',
      },
      boxShadow: {
        gold: '0 0px 32px rgba(53, 86, 100, 0.12)',
        'gold-lg': '0 24px 48px rgba(53, 86, 100, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
