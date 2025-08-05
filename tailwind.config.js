/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#4B2EDE',
          600: '#3916b8',
          700: '#2d0f92',
          800: '#220b6d',
          900: '#1a0749',
        },
        accent: {
          green: '#00C878',
          yellow: '#FFD700',
        },
        brand: {
          primary: '#4B2EDE',
          'green-accent': '#00C878',
          'yellow-accent': '#FFD700',
          'header-text': '#3100A0',
          'body-text': '#333333',
          'primary-bg': '#FFFFFF',
          'secondary-bg': '#F7F7F7',
        }
      },
      animation: {
        'confetti': 'confetti 0.6s ease-out',
      },
      keyframes: {
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '0.8' },
          '100%': { transform: 'scale(0.8) rotate(360deg)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}