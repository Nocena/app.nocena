/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        nocenaBg: '#000000',
        nocenaBlue: '#2353FF',
        nocenaPurple: '#6024FB',
        nocenaPink: '#FF15C9',

        // NFT Rarity Colors - designed for dark theme
        rarityCommon: '#6B7280', // Neutral gray - subtle but visible
        rarityUncommon: '#10B981', // Emerald green - fresh and noticeable
        rarityRare: '#3B82F6', // Bright blue - matches your nocenaBlue family
        rarityEpic: '#8B5CF6', // Vibrant purple - complements nocenaPurple
        rarityLegendary: '#F59E0B', // Amber gold - warm contrast to your cool palette

        // Alternative rarity variations for different contexts
        rarityCommonDark: '#4B5563', // Darker gray for backgrounds
        rarityUncommonDark: '#047857', // Darker green for backgrounds
        rarityRareDark: '#1E40AF', // Darker blue for backgrounds
        rarityEpicDark: '#6D28D9', // Darker purple for backgrounds
        rarityLegendaryDark: '#D97706', // Darker gold for backgrounds
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        thematic: ['"Montserrat Alt 1"', 'sans-serif'],
      },
      // Add custom gradient stops for consistency
      backgroundImage: {
        // Navigation gradients from your BottomNavbar
        'nav-home': 'linear-gradient(270deg, #000000 0%, #00006A 100%)',
        'nav-map': 'linear-gradient(270deg, #FF40A9 0%, #F95FD6 100%)',
        'nav-inbox': 'linear-gradient(270deg, #6A4CFF 0%, #8965FF 100%)',
        'nav-search': 'linear-gradient(270deg, #2353FF 0%, #002ED3 100%)',

        // Brand gradients using your theme colors
        'nocena-blue': 'linear-gradient(135deg, #2353FF 0%, #002ED3 100%)',
        'nocena-purple': 'linear-gradient(135deg, #6024FB 0%, #4A1FB8 100%)',
        'nocena-pink': 'linear-gradient(135deg, #FF15C9 0%, #E010B6 100%)',

        // Diagonal variations
        'nocena-blue-diagonal': 'linear-gradient(45deg, #2353FF 0%, #002ED3 100%)',
        'nocena-purple-diagonal': 'linear-gradient(45deg, #6024FB 0%, #4A1FB8 100%)',
        'nocena-pink-diagonal': 'linear-gradient(45deg, #FF15C9 0%, #E010B6 100%)',

        // Radial gradients for special effects
        'nocena-blue-radial': 'radial-gradient(circle, #2353FF 0%, #002ED3 100%)',
        'nocena-purple-radial': 'radial-gradient(circle, #6024FB 0%, #4A1FB8 100%)',
        'nocena-pink-radial': 'radial-gradient(circle, #FF15C9 0%, #E010B6 100%)',

        // Multi-color brand gradient
        'nocena-brand': 'linear-gradient(135deg, #2353FF 0%, #6024FB 50%, #FF15C9 100%)',
        'nocena-brand-reverse': 'linear-gradient(135deg, #FF15C9 0%, #6024FB 50%, #2353FF 100%)',

        // Subtle variants with transparency
        'nocena-blue-fade': 'linear-gradient(135deg, rgba(35, 83, 255, 0.8) 0%, rgba(0, 46, 211, 0.6) 100%)',
        'nocena-purple-fade': 'linear-gradient(135deg, rgba(96, 36, 251, 0.8) 0%, rgba(74, 31, 184, 0.6) 100%)',
        'nocena-pink-fade': 'linear-gradient(135deg, rgba(255, 21, 201, 0.8) 0%, rgba(224, 16, 182, 0.6) 100%)',

        // NFT Rarity gradients for special effects
        'rarity-common': 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
        'rarity-uncommon': 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
        'rarity-rare': 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
        'rarity-epic': 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        'rarity-legendary': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      },
      animation: {
        'glitchPink': 'glitchPink 1s infinite',
        'glitchBlue': 'glitchBlue 1s infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'legendary-glow': 'legendaryGlow 2s ease-in-out infinite alternate',
        'epic-pulse': 'epicPulse 1.5s ease-in-out infinite',
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
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        legendaryGlow: {
          '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.8)' },
        },
        epicPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
};
