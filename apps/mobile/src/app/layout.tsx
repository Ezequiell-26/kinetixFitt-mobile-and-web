import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./kinetix-reference-theme.css";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { PostHogProvider } from "@/components/posthog-provider";
import { OfflineIndicator } from "@/components/offline-indicator";
import { BRAND } from "@/constants/branding";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || BRAND.app.appUrl),
  title: `${BRAND.name} — Entrenamiento Personalizado Online`,
  description: "Programa a medida, seguimiento real y contacto directo con tu coach. Entrenamiento, nutrición y progreso desde tu celular.",
  applicationName: BRAND.name,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: BRAND.name },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/brand/kinetixfitt-mark.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: `${BRAND.name} — Tu mejor versión, cada día`,
    description: "Entrenamiento personalizado online con seguimiento real.",
    type: "website",
    locale: "es_AR",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${BRAND.name} — Tu mejor versión, cada día` }],
  },
  keywords: ["entrenamiento", "fitness", "coach", "nutrición", "gym", "ejercicios", "salud"],
  authors: [{ name: BRAND.name }],
  robots: "index, follow",
};

export const viewport: Viewport = {
  themeColor: BRAND.colors.dark,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script src="/theme-init.js" />
      </head>
      <body className={`${inter.variable} ${grotesk.variable} min-h-screen text-zinc-100 antialiased selection:bg-primary selection:text-black`} style={{ backgroundColor: BRAND.colors.dark }}>
        <PostHogProvider>
          <ThemeProvider>
            <OfflineIndicator />
            {children}
            <PwaRegister />
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
