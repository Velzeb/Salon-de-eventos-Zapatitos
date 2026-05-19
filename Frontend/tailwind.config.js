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
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        bg: {
          main: 'var(--bg-main)',
          dark: 'var(--bg-dark)',
          glass: 'var(--bg-glass)',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        main: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': 'var(--shadow-premium)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px -3px rgba(79, 70, 229, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
      backgroundImage: {
        'primary-gradient': 'var(--primary-gradient)',
      }
    },
  },
  plugins: [],
}

