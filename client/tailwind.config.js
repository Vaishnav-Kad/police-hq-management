/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hq: {
          bg: '#0B0F19',
          card: '#111827',
          sidebar: '#0D1322',
          border: '#1F2937',
          accent: '#1E40AF',
          accentHover: '#1D4ED8',
          text: '#F3F4F6',
          muted: '#9CA3AF',
        },
      },
    },
  },
  plugins: [],
}
