/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Token-driven theming: the `.dark` class on <html> swaps CSS variables,
      // so every `bg-surface` / `text-ink` utility re-themes automatically.
      colors: {
        canvas: 'var(--sq-canvas)',
        surface: {
          DEFAULT: 'var(--sq-surface)',
          2: 'var(--sq-surface-2)',
          3: 'var(--sq-surface-3)',
        },
        line: {
          DEFAULT: 'var(--sq-line)',
          strong: 'var(--sq-line-strong)',
        },
        ink: {
          DEFAULT: 'var(--sq-ink)',
          2: 'var(--sq-ink-2)',
          3: 'var(--sq-ink-3)',
        },
        accent: {
          DEFAULT: 'var(--sq-accent)',
          fg: 'var(--sq-accent-fg)',
          soft: 'var(--sq-accent-soft)',
        },
        sun: 'var(--sq-sun)',
        ok: { DEFAULT: 'var(--sq-ok)', soft: 'var(--sq-ok-soft)' },
        warn: { DEFAULT: 'var(--sq-warn)', soft: 'var(--sq-warn-soft)' },
        danger: { DEFAULT: 'var(--sq-danger)', soft: 'var(--sq-danger-soft)' },
        scrim: 'var(--sq-scrim)',
      },
      boxShadow: {
        card: 'var(--sq-shadow)',
        lift: 'var(--sq-shadow-lg)',
      },
      fontFamily: {
        // UI/UX Pro Max: Fira Sans for UI text, Fira Code for technical figures.
        // Noto Sans is kept in both stacks as the guaranteed Naira (U+20A6) provider.
        sans: [
          'Fira Sans',
          'Noto Sans',
          'Segoe UI Symbol',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['Fira Code', 'Noto Sans', 'ui-monospace', 'monospace'],
      },
      // Organic Biomorphic style calls for generous 16-24px radii.
      borderRadius: {
        card: 'var(--sq-radius)',
        xl2: 'var(--sq-radius-lg)',
        sm2: 'var(--sq-radius-sm)',
      },
    },
  },
  plugins: [],
}
