/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000',
          light: '#1a1a1a',
        },
        danger: {
          DEFAULT: '#ff0000',
          light: '#ff3333',
          dark: '#cc0000',
        },
        warning: {
          DEFAULT: '#ffff00',
          light: '#ffff66',
          dark: '#cccc00',
        },
        success: {
          DEFAULT: '#00ff00',
          light: '#66ff66',
          dark: '#00cc00',
        },
      },
    },
  },
  plugins: [],
}
