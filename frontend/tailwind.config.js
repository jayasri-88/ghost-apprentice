/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      colors: {
        surface: "#ffffff",
        canvas: "#fafaf9",
        line: "#e7e5e4",
        text: {
          DEFAULT: "#1c1917",
          muted: "#57534e",
          subtle: "#a8a29e",
        },
        good: {
          DEFAULT: "#3f6b52",
          soft: "#eef2ee",
        },
        warn: {
          DEFAULT: "#7a6116",
          soft: "#f7f1df",
        },
        bad: {
          DEFAULT: "#8a4438",
          soft: "#f6ebe8",
        },
        night: "#1c1917",
      },
    },
  },
  plugins: [],
};
