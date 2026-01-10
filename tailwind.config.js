/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        'reading-white': '#ffffff',
        'reading-yellow': '#f4ecd8',
        'reading-dark': '#1e1e1e',
        'reading-green': '#c7edcc',
      },
    },
  },
  plugins: [],
}
