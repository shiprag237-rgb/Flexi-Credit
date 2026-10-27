/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f7fe',
          100: '#eeeffc',
          200: '#dedff9',
          300: '#c3c5f4',
          400: '#9e9fec',
          500: '#7371e2',
          600: '#5551d8',
          700: '#4642bf',
          800: '#3a369e',
          900: '#322e80',
          950: '#1d1a51',
        },
        navy: {
          700: '#26262b',
          800: '#1a191f',
          900: '#121116',
          950: '#0a0a0d',
        },
        warm: {
          50: '#faf8f5',
          100: '#f4f1eb',
          200: '#e8e3d8',
          300: '#d5cdc0',
          400: '#b8aca0',
          500: '#96887a',
          600: '#75695d',
          700: '#5c5249',
          800: '#433c36',
          900: '#2b2622',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
