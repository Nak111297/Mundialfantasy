import type { Config } from "tailwindcss";

// Paleta inspirada en la identidad del Mundial 2026 (Canadá / México / EE.UU.)
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wc: {
          green: "#006847", // verde México
          red: "#C8102E", // rojo Canadá
          blue: "#1F4E9C", // azul EE.UU.
          navy: "#0B1B3A",
          dark: "#070F22",
          gold: "#FFC72C",
          sand: "#F4EFE6",
        },
      },
      backgroundImage: {
        "wc-gradient":
          "linear-gradient(100deg, #006847 0%, #1F4E9C 50%, #C8102E 100%)",
        "wc-soft":
          "radial-gradient(1200px 600px at 80% -10%, rgba(31,78,156,.35), transparent), radial-gradient(900px 500px at 10% 110%, rgba(0,104,71,.30), transparent)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(255,199,44,.25)",
      },
    },
  },
  plugins: [],
};
export default config;
