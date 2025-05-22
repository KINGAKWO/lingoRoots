/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'marine-blue': '#005f73',
        'sky-blue': '#0a9396',
        'black': '#000000',
        'white': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}