import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFD60A",
          yellowHover: "#FFC300",
          // Logo mockup palette
          navy: "#0B1747",
          navyDeep: "#070F2E",
          blue: "#1E5BFF",
          blueLight: "#3B7BFF",
          ink: "#0B1220",
          slate: "#1F2937",
          mist: "#F5F7FB",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "shiny-shimmer": {
          "0%, 90%, 100%": { "background-position": "calc(-100% - var(--shimmer-width)) 0" },
          "30%, 60%": { "background-position": "calc(100% + var(--shimmer-width)) 0" },
        },
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
      },
      animation: {
        marquee: "marquee var(--duration, 40s) linear infinite",
        "shiny-shimmer": "shiny-shimmer 8s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
