/**
 * KinetixFitt - Brand Configuration
 * Centralizes all branding constants for the app
 */

export const BRAND = {
  // Main brand name
  name: "KinetixFitt",
  nameShort: "Kinetix",
  tagline: "Transform Your Fitness Journey",
  taglineES: "Transforma Tu Viaje Fitness",
  
  // Company info
  company: {
    fullName: "KinetixFitt Inc.",
    foundedYear: 2026,
    country: "Argentina",
  },

  // Contact
  contact: {
    email: "support@kinetixfitt.com",
    website: "https://kinetixfitt.com",
    instagram: "@kinetixfitt",
    twitter: "@kinetixfitt",
  },

  // App identifiers
  app: {
    id: "com.kinetixfitt.app",
    version: "1.0.0",
    bundleId: "com.kinetixfitt",
  },

  // Descriptions
  description: {
    short: "Professional fitness coaching platform for trainers and clients",
    shortES: "Plataforma profesional de coaching fitness para entrenadores y clientes",
    long: "KinetixFitt is the ultimate fitness coaching platform that connects trainers with their clients. Track workouts, nutrition, progress, and achieve your fitness goals with personalized programs and real-time support.",
    longES: "KinetixFitt es la plataforma definitiva de coaching fitness que conecta entrenadores con sus clientes. Rastrea entrenamientos, nutrición, progreso y alcanza tus objetivos fitness con programas personalizados y soporte en tiempo real.",
  },

  // Colors (from design system)
  colors: {
    primary: "#34D399", // Emerald primary
    primaryRGB: "52, 211, 153",
    dark: "#09090B", // Zinc-950
    darkRGB: "9, 9, 11",
  },

  // Social proof
  stats: {
    trainers: "1,000+",
    clients: "10,000+",
    workouts: "100,000+",
    countries: "15+",
  },

  // Features
  features: [
    "Workout Tracking",
    "Nutrition Plans",
    "Progress Analytics",
    "AI-Powered Insights",
    "Real-time Messaging",
    "Payment Processing",
    "Mobile & Desktop Apps",
    "Gamification System",
  ],

  // SEO
  seo: {
    keywords: [
      "fitness coaching",
      "personal trainer app",
      "workout tracking",
      "nutrition planning",
      "fitness goals",
      "gym tracker",
      "training platform",
      "KinetixFitt",
    ],
    ogImage: "/og-image.jpg",
    twitterCard: "summary_large_image",
  },
} as const;

// Helper to get formatted brand name with optional suffix
export function getBrandName(variant: "default" | "short" | "with-tagline" = "default"): string {
  switch (variant) {
    case "short":
      return BRAND.nameShort;
    case "with-tagline":
      return `${BRAND.name} — ${BRAND.taglineES}`;
    default:
      return BRAND.name;
  }
}

// Helper to get copyright text
export function getCopyright(year?: number): string {
  const currentYear = year || new Date().getFullYear();
  return `© ${currentYear} ${BRAND.company.fullName}. All rights reserved.`;
}

// Helper to get contact email with subject
export function getContactEmail(subject?: string): string {
  const encodedSubject = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${BRAND.contact.email}${encodedSubject}`;
}

export default BRAND;
