/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      /* All colour resolves through the CSS variables declared in index.css,
         so light/dark is a token swap rather than a `dark:` variant on every
         element. Keys are deliberately named for role; `strong`/`line` avoid
         colliding with Tailwind's own `text-base`/`border-*` utilities. */
      colors: {
        'brand-orange': 'var(--brand-orange)',
        'on-brand': 'var(--on-brand)',
        'bg-canvas': 'var(--bg-canvas)',
        'bg-surface': 'var(--bg-surface)',
        'bg-card': 'var(--bg-card)',
        'strong': 'var(--text-strong)',
        'text-muted': 'var(--text-muted)',
        'line-subtle': 'var(--border-subtle)',
        'line': 'var(--border-base)',
        'line-strong': 'var(--border-strong)',
        'elevate': 'var(--surface-elevate)',
        'overlay': 'var(--overlay)',
        'cat-behavioral': 'rgb(var(--cat-behavioral) / <alpha-value>)',
        'cat-behavioral-bg': 'rgb(var(--cat-behavioral-bg) / <alpha-value>)',
        'cat-technical': 'rgb(var(--cat-technical) / <alpha-value>)',
        'cat-technical-bg': 'rgb(var(--cat-technical-bg) / <alpha-value>)',
        'cat-design': 'rgb(var(--cat-design) / <alpha-value>)',
        'cat-design-bg': 'rgb(var(--cat-design-bg) / <alpha-value>)',
        'cat-general': 'rgb(var(--cat-general) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards'
      }
    },
  },
  plugins: [],
}
