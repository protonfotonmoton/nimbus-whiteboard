import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nimbus: {
          bg: "#0a0a0a",
          surface: "#111114",
          card: "#161619",
          elevated: "#1c1c20",
          gold: "#c9a84c",
          "gold-dim": "#8a7a3a",
          "gold-bright": "#e8d5a0",
          cyan: "#00d4ff",
          "cyan-dim": "#0099b8",
          text: "#f7f8f8",
          "text-secondary": "#d0d6e0",
          "text-muted": "#8a8f98",
          "text-dim": "#62666d",
          border: "rgba(255,255,255,0.08)",
          "border-subtle": "rgba(255,255,255,0.05)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        nimbus: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
