/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#18181b',
        'surface-highlight': '#27272a',
        primary: '#fbbf24',
        'primary-foreground': '#000000',
        secondary: '#10b981',
        accent: '#f59e0b',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
        border: '#27272a',
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
