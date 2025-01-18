/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nocenaBg: '#0A141D',
        nocenaBlue: '#10CAFF',
        nocenaPink: '#FD4EF5',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        thematic: ['"Montserrat Alt 1"', 'sans-serif'],
      },
      animation: {
        glitchPink: 'glitchPink 1s infinite',
        glitchBlue: 'glitchBlue 1s infinite',
      },
      keyframes: {
        glitchPink: {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '1' },
          '20%': { transform: 'translate(-2px, -2px)', opacity: '0.9' },
          '40%': { transform: 'translate(2px, 2px)', opacity: '0.8' },
          '60%': { transform: 'translate(-1px, 1px)', opacity: '0.9' },
          '80%': { transform: 'translate(1px, -1px)', opacity: '0.8' },
        },
        glitchBlue: {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '1' },
          '20%': { transform: 'translate(2px, 2px)', opacity: '0.9' },
          '40%': { transform: 'translate(-2px, -2px)', opacity: '0.8' },
          '60%': { transform: 'translate(1px, -1px)', opacity: '0.9' },
          '80%': { transform: 'translate(-1px, 1px)', opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}