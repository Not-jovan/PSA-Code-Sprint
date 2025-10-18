/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // we toggle the html class in App.tsx
    content: [
      "./public/index.html",
      "./src/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {}
    },
    plugins: [
      // require('@tailwindcss/forms'),
      // require('@tailwindcss/typography'),
      // require('@tailwindcss/aspect-ratio'),
    ],
  };
  