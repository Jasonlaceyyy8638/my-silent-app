import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          800: "#1a1a1f",
          900: "#121216",
          950: "#0c0c0e",
        },
        petroleum: "#0f172a",
        "teal-accent": "#22d3ee",
        "lime-accent": "#a3e635",
        accent: {
          DEFAULT: "#22d3ee",
          muted: "#a3e635",
        },
      },
      boxShadow: {
        "teal-glow": "0 0 25px rgba(34, 211, 238, 0.3)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        "checkmark-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "55%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "checkmark-pop": "checkmark-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
