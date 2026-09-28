/**
 * KinetixFitt brand source of truth.
 * Keep visual identity centralized so web/mobile surfaces stay consistent.
 */
export const BRAND = {
  name: "KINETIXFITT",
  shortName: "KinetixFitt",
  tagline: "TU MEJOR VERSIÓN",
  colors: {
    // `lime` naming is retained as a compatibility alias; the canonical accent is emerald.
    lime: "#34D399",
    limeHover: "#6EE7B7",
    dark: "#081119",
    darkElevated: "#0B151E",
    zinc: "#12212D",
    muted: "#8193A5",
    border: "#1C3142",
  },
  app: {
    id: "com.kinetixfitt.app",
    url: "https://kinetixfitt.com",
    appUrl: "https://app.kinetixfitt.com",
  },
  support: {
    email: "hola@kinetixfitt.com",
  },
} as const;

export const BRAND_TOKENS = {
  bgLime: "bg-primary",
  textLime: "text-primary",
  borderLime: "border-primary",
  bgDark: "bg-[#081119]",
} as const;
