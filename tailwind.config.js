/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scope utilities under #app so Tailwind wins over legacy styles without !important
  important: '#app',
  content: [
    './*.html',
    './**/*.html',
    './*.js',
    './**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        accent: {
          DEFAULT: '#111111',
          red: '#7c2424',
          blue: '#183f88',
          green: '#214622',
          purple: '#7d648d',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
