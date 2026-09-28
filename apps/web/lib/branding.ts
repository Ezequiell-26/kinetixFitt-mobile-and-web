/**
 * BRAND — single source of truth for the KinetixFitt web experience.
 * Keep product identity centralized so web and app stay visually consistent.
 */
export const BRAND = {
  name: 'KinetixFitt',
  shortName: 'KinetixFitt',
  displayName: 'KINETIXFITT',
  tagline: 'TU MEJOR VERSIÓN',
  colors: {
    lime: '#34D399',
    limeHover: '#6EE7B7',
    dark: '#081119',
    darkElevated: '#0B151E',
    zinc: '#12212D',
    muted: '#8193A5',
    border: '#1C3142',
  },
  app: {
    id: 'com.kinetixfitt.app',
    url: 'https://kinetixfitt.com',
    appUrl: 'https://app.kinetixfitt.com',
  },
  support: {
    email: 'hola@kinetixfitt.com',
  },
} as const;

export const BRAND_TOKENS = {
  bgLime: 'bg-primary',
  textLime: 'text-primary',
  borderLime: 'border-primary',
  bgDark: 'bg-[#081119]',
} as const;
