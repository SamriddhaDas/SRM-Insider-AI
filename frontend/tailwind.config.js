/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        srm: {
          50:  '#eff3fb',
          100: '#dce8f7',
          200: '#b9d1ef',
          300: '#8eb3e5',
          400: '#5a8ed6',
          500: '#2d6cc4',
          600: '#1a3a6b',
          700: '#152f58',
          800: '#0f2345',
          900: '#091833',
        },
        accent: {
          50:  '#fdf8ec',
          100: '#fbefd0',
          400: '#e8a020',
          500: '#d4901a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease forwards',
        'slide-up': 'slideUp 0.2s ease forwards',
        'pulse-dot': 'pulseDot 1s ease-in-out infinite',
        'spin-slow': 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
      },
    },
  },
  plugins: [],
}
