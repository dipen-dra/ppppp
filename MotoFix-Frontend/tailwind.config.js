/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Cream Backgrounds ──────────────────────────────
        cream: {
          50:  '#FDFDF8',  // page background (lightest)
          100: '#FAF9F2',  // primary background
          200: '#F5F3E7',  // section alternate
          300: '#EDE9D5',  // borders / dividers
          400: '#D9D3B8',  // muted borders
          500: '#B8B097',  // placeholder text
        },
        // ── Deep Black ────────────────────────────────────
        ink: {
          950: '#06060A',  // darkest — sidebars / hero overlays
          900: '#0D0D14',  // navbar, sidebar bg
          800: '#141420',  // card surfaces in dark sections
          700: '#1E1E2E',  // elevated cards (dark)
          600: '#2A2A3E',  // dark borders
          500: '#3A3A52',  // muted dark element
          400: '#5A5A78',  // dark secondary text
          300: '#8080A0',  // dark tertiary
          200: '#B0B0C8',  // dark muted primary text
          100: '#E0E0EC',  // near-white text on dark
          50:  '#F5F5FA',  // white text on dark
        },
        // ── Brand Yellow ──────────────────────────────────
        yellow: {
          DEFAULT: '#F5C000',
          50:  '#FFFBEB',
          100: '#FFF3C0',
          200: '#FFE066',
          300: '#FFCC00',
          400: '#F5C000',   // ← primary brand yellow
          500: '#E6B000',   // hover / pressed
          600: '#CC9A00',   // dark variant
          700: '#A37A00',   // very dark
          800: '#7A5A00',
          900: '#523C00',
        },
        // ── Semantic aliases for components ───────────────
        brand: {
          DEFAULT: '#F5C000',
          light:   '#FFFBEB',
          dark:    '#1A1A00',
          hover:   '#E6B000',
          muted:   'rgba(245,192,0,0.15)',
          glow:    'rgba(245,192,0,0.25)',
        },
        // ── Legacy tokens (mapped to new palette) ─────────
        garage: {
          950: '#06060A',
          900: '#0D0D14',
          850: '#111118',
          800: '#141420',
          750: '#1A1A28',
          700: '#1E1E2E',
          600: '#2A2A3E',
          500: '#3A3A52',
          400: '#5A5A78',
          300: '#8080A0',
          200: '#B0B0C8',
          100: '#E0E0EC',
        },
        spark: {
          500: '#F5C000',
          400: '#FFCC00',
          300: '#FFD966',
          200: '#FFE8A0',
          100: '#FFF8DC',
        },
        chrome: {
          500: '#1A1A28',   // primary dark text (on cream bg)
          400: '#3A3A52',
          300: '#5A5A78',
        },
        signal: {
          green:  '#16A34A',
          amber:  '#D97706',
          red:    '#DC2626',
          blue:   '#2563EB',
        },
      },
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['12px', { lineHeight: '16px' }],
        sm:    ['13px', { lineHeight: '20px' }],
        base:  ['14px', { lineHeight: '22px' }],
        md:    ['15px', { lineHeight: '24px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['30px', { lineHeight: '38px' }],
        '5xl': ['36px', { lineHeight: '44px' }],
        '6xl': ['48px', { lineHeight: '56px' }],
        '7xl': ['60px', { lineHeight: '68px' }],
        '8xl': ['72px', { lineHeight: '80px' }],
      },
      borderRadius: {
        sm:    '6px',
        md:    '10px',
        lg:    '14px',
        xl:    '20px',
        '2xl': '28px',
        '3xl': '36px',
        pill:  '999px',
      },
      boxShadow: {
        'glow':       '0 0 24px rgba(245,192,0,0.3)',
        'glow-sm':    '0 0 12px rgba(245,192,0,0.2)',
        'glow-lg':    '0 0 48px rgba(245,192,0,0.35)',
        'card':       '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12)',
        'card-dark':  '0 4px 24px rgba(0,0,0,0.5)',
        'soft':       '0 2px 8px rgba(0,0,0,0.06)',
        'inner':      'inset 0 1px 3px rgba(0,0,0,0.08)',
        'yellow-glow':'0 4px 20px rgba(245,192,0,0.35)',
        'dark-sm':    '0 2px 8px rgba(0,0,0,0.35)',
        'dark-lg':    '0 8px 40px rgba(0,0,0,0.55)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #F5C000, #E6B000)',
        'gradient-brand-r': 'linear-gradient(135deg, #FFD700, #F5C000)',
        'gradient-dark':    'linear-gradient(135deg, #06060A, #0D0D14)',
        'gradient-cream':   'linear-gradient(135deg, #FDFDF8, #F5F3E7)',
        'gradient-radial':  'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'hero-pattern':     "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease forwards',
        'fade-in-up':   'fadeInUp 0.6s ease forwards',
        'fade-in-down': 'fadeInDown 0.5s ease forwards',
        'slide-left':   'slideInLeft 0.5s ease forwards',
        'slide-right':  'slideInRight 0.5s ease forwards',
        'scale-in':     'scaleIn 0.4s ease forwards',
        'float':        'float 4s ease-in-out infinite',
        'glow-pulse':   'glowPulse 2.5s ease-in-out infinite',
        'spin-fast':    'spin 0.7s linear infinite',
        'shimmer':      'shimmer 1.5s ease infinite',
        'gradient':     'gradientShift 3s ease infinite',
        'bounce-soft':  'bounceSoft 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '32px',
      },
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
        '22':  '88px',
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight:   '-0.02em',
        normal:  '0em',
        wide:    '0.03em',
        wider:   '0.06em',
        widest:  '0.1em',
      },
    },
  },
  plugins: [],
};