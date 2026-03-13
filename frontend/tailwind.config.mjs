/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#05070b",
          card: "#0f172a",
          subtle: "#020617"
        },
        accent: {
          green: "#22c55e",
          yellow: "#eab308",
          red: "#ef4444",
          blue: "#3b82f6",
          purple: "#a855f7"
        }
      },
      borderRadius: {
        xl: "1rem"
      }
    }
  },
  plugins: []
};

