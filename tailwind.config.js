const withAlpha = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: withAlpha('bg'),
        surface: withAlpha('surface'),
        surface2: withAlpha('surface-2'),
        border: withAlpha('border'),
        fg: withAlpha('fg'),
        muted: withAlpha('muted'),
        accent: withAlpha('accent'),
        'accent-fg': withAlpha('accent-fg'),
        danger: withAlpha('danger'),
        warn: withAlpha('warn'),
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
