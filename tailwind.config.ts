import type { Config } from "tailwindcss";

// Ace Mobility design system. Warm cream canvas, soft white cards, a terracotta primary, a
// deep forest green for positive money and the active navigation, and an ocean blue for the
// broker and commission side. Serif display type for headings and big numbers.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f6f1e7",
        card: "#ffffff",
        line: "#e8e0d2",
        ink: "#2b2a24",
        muted: "#8c8475",
        clay: {
          DEFAULT: "#bf6240",
          dark: "#a5512f",
        },
        forest: {
          DEFAULT: "#3c5a34",
          dark: "#1e2c1d",
        },
        ocean: "#2c4a5e",
        // Soft badge fills.
        "green-soft": "#e3ede0",
        "blue-soft": "#dbe6ec",
        "peach-soft": "#f4e3d6",
        tan: "#ece3d4",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      maxWidth: {
        content: "72rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(43, 42, 36, 0.04), 0 1px 3px rgba(43, 42, 36, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
