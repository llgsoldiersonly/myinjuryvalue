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
    },
  },
  plugins: [],
};

export default config;
