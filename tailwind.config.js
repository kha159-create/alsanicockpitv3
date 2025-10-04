/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'card-background': '#ffffff', // Added the custom color definition
      },
    },
  },
  plugins: [],
}

