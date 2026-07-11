/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta Onda Digital — Lençóis Maranhenses
        bg: {
          deep: '#071E1C',
          surface: '#0D3B38',
          elevated: '#154F4A',
          overlay: '#1A5F59',
        },
        cerulean: {
          50: '#E0F7FF',
          100: '#BAF0FF',
          200: '#7DE3FF',
          300: '#38D1FB',
          400: '#0BBCE8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        gold: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        teal: {
          primary: '#0D3B38',
          light: '#14B8A6',
          muted: '#5EEAD4',
        },
        text: {
          primary: '#F0FDFA',
          muted: '#99F6E4',
          subtle: '#5EEAD4',
          inverse: '#071E1C',
        },
        status: {
          success: '#22C55E',
          warning: '#FBBF24',
          danger: '#EF4444',
          info: '#0EA5E9',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-ocean': 'linear-gradient(135deg, #071E1C 0%, #0D3B38 50%, #154F4A 100%)',
        'gradient-cerulean': 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        'gradient-card': 'linear-gradient(145deg, #0D3B38 0%, #154F4A 100%)',
        'wave-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,60 C300,100 600,20 900,60 C1050,80 1150,50 1200,60 L1200,120 L0,120 Z' fill='%230D3B38' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(14,165,233,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.2)',
        'glow-cerulean': '0 0 20px rgba(14,165,233,0.3)',
        'glow-gold': '0 0 20px rgba(251,191,36,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'wave': 'wave 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        wave: { '0%,100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(-10px)' } },
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}
