/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#e23744', dark: '#b71c2b', light: '#ffe8ea' },
      },
    },
  },
  plugins: [],
};
