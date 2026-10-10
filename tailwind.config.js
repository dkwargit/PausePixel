/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          DEFAULT: '#090d16',
          card: 'rgba(22, 29, 47, 0.75)',
          input: 'rgba(11, 16, 28, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 8s ease-in-out infinite alternate',
        'laser': 'laser 1s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%': { transform: 'scale(1) translate(0, 0)', opacity: '0.35' },
          '50%': { transform: 'scale(1.15) translate(30px, 20px)', opacity: '0.55' },
          '100%': { transform: 'scale(0.95) translate(-20px, -15px)', opacity: '0.4' },
        },
        'laser': {
          '0%': { opacity: '0.3' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.3' },
        }
      }
    },
  },
  plugins: [],
}
