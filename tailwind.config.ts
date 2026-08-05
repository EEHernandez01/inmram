import type { Config } from "tailwindcss";

/**
 * Tokens de diseño — Dirección A "Banca privada"
 * Sistema de Control y Automatización de Cobranza de Rentas
 *
 * Copia este archivo a la raíz de tu proyecto Next.js.
 * Ver DESIGN-SYSTEM.md para el uso y justificación de cada token.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondo y superficies
        bg: "#FAFAF9",
        surface: "#FFFFFF",
        border: "#E7E5E4",

        // Texto
        ink: {
          DEFAULT: "#1C1917",
          secondary: "#78716C",
        },

        // Marca / acento
        brand: {
          DEFAULT: "#1E3A5F",
          hover: "#17304D",
          soft: "#E8EEF4",
        },

        // Estatus funcionales (pagado / pendiente / vencido)
        success: {
          DEFAULT: "#166534",
          soft: "#E7F5EC",
        },
        warning: {
          DEFAULT: "#B45309",
          soft: "#FDF3E4",
        },
        danger: {
          DEFAULT: "#B91C1C",
          soft: "#FBEAEA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Source Serif 4", "Georgia", "serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        card: "10px",
        pill: "9999px",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;
