import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        background: {
          light: "#FFFFFF",
          dark: "#09090B",
        },
        surface: {
          light: "#F9FAFB",
          dark: "#18181B",
        },
        border: {
          light: "#E5E7EB",
          dark: "#27272A",
        },
        ink: {
          light: "#111827",
          dark: "#FAFAFA",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        code: ["Space Grotesk", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        lg: "0.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
