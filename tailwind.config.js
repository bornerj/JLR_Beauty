/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './apps/web/index.html',
    './apps/web/src/**/*.{js,jsx,ts,tsx,html}',
    './apps/web/src/legacy/**/*.{html,js,ts}',
  ],
  safelist: ['max-w-[960px]'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#00967f',
        'background-light': '#f8fcf9',
        'background-dark': '#0d1b12',
        forest: '#0d1b12',
        'forest-green': '#102216',
        gold: '#c5a059',
        'gold-accent': '#d4af37',
        'gold-light': '#e8dcc4',
        'cream-sidebar': '#faf9f6',
        champagne: '#f3efe0',
        'champagne-dark': '#e8e0c5'
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
        serif: ['Montserrat', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      }
    }
  }
};
