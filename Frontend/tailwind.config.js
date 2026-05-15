/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          light: '#6366f1',
          dark: '#4338ca',
        },
        secondary: '#10b981',
        accent: '#ef4444',
        bg: {
          main: '#f9fafb',
          dark: '#1f2937',
          sidebar: '#111827',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        main: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px -3px rgba(79, 70, 229, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
      }
    },
  },
  plugins: [],
}

