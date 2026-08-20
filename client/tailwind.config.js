/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#d8cbb8",
        linen: "#bfb4a3",
        "warm-stone": "#b6ab9c",
        walnut: "#978e81",
        espresso: "#615b53",
        "onyx-warm": "#2c2c2c",
        "midnight-roast": "#292622",
        "saffron-glow": "#d49653",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
