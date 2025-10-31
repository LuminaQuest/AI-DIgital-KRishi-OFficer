/** @type {import('tailwindcss').Config} */
export default {
  // CRITICAL: This line tells Tailwind where to look for class names in your files
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Extend the default color palette with custom branding
    extend: {
      colors: {
        // Custom green for the Krishi theme
        'krishi-green': '#10b981', // Emerald-500 equivalent
        // Custom dark color for backgrounds/text contrast
        'krishi-dark': '#0f172a', // Slate-900 equivalent 
      },
      fontFamily: {
        // Set Inter as the primary font for the application
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        // Custom shadow for the chat input container
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
