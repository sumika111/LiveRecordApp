import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        live: {
          50: "#fffbf5",
          100: "#fff4e0",
          200: "#ffe4b8",
          300: "#ffd080",
          400: "#f5a623",
          500: "#e08c00",
          600: "#c27400",
          700: "#9a5c00",
          800: "#6b3f00",
          900: "#3d2400",
        },
        surface: {
          DEFAULT: "#faf8f5",
          card: "#ffffff",
          muted: "#f3efe8",
        },
      },
      borderRadius: {
        card: "1rem",
        button: "0.75rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        cardHover: "0 8px 24px rgba(0,0,0,0.08)",
      },
      transitionDuration: {
        200: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
