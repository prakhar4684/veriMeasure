/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0A2540',
          blue: '#1E3A8A',
          saffron: '#FF6B00',
          green: '#15803D',
          gold: '#D97706',
          bg: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}
