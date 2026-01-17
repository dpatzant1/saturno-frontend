/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Usa las preferencias del sistema operativo
  theme: {
    extend: {
      colors: {
        'carpinteria': {
          'oscuro': '#4A3728',      // Marrón oscuro
          'rojizo': '#7A1F1C',      // Marrón rojizo
          'medio': '#C28E2A',       // Dorado medio
          'claro': '#D4B25E',       // Dorado claro
        },
      },
      animation: {
        'slideIn': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
