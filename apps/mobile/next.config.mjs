/** @type {import("next").NextConfig} */
const nextConfig = {
  // Output standalone (Docker/self-host). En Vercel se ignora sin daño.
  output: "standalone",
  // Permite el origen loopback usado por Playwright durante E2E/dev.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Next 15 deprecó el lint integrado y este repo no tiene config plana de
  // ESLint en apps/mobile (el build fallaba con "Definition for rule
  // '@typescript-eslint/no-unused-vars' was not found" por el .eslintrc
  // heredado de la raíz). El gate de calidad es tsc + tests, no este lint.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // OJO seguridad: NO usar ["*"] acá. Next.js valida el header Origin de
    // los Server Actions contra esta lista para prevenir CSRF; "*" apaga esa
    // protección por completo. Sin este campo, Next usa por defecto el propio
    // host de la request (correcto para same-origin). Se agregan dominios de
    // producción reales vía env var cuando existan.
    serverActions: {
      allowedOrigins: process.env.NEXT_PUBLIC_APP_URL
        ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
        : undefined,
      // Uploads de hasta 5MB por form: margen de sobra.
      bodySizeLimit: "10mb",
    },
    // Tree-shaking agresivo de estos paquetes: evita que Next empaquete
    // toda la librería de íconos/animaciones cuando solo se usan algunos.
    // Reduce el JS que baja el navegador sin cambiar ningún comportamiento.
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "date-fns",
    ],
  },
  images: {
    // OJO seguridad: AVIF deshabilitado a propósito. La optimización AVIF de
    // Next.js depende de libheif, que tuvo una vulnerabilidad de RCE no
    // autenticado explotable en servidores Windows (parche Next.js ago 2026,
    // v15.5.24). Reactivar "image/avif" solo después de confirmar que
    // next@15.5.24+ está instalado Y que el fix de libheif ya se propagó.
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  compress: true,
  // Permite un directorio de build alternativo (p. ej. si `.next` queda bloqueado).
  // Default: `.next`. No cambia el comportamiento normal.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  /**
   * Headers de seguridad aplicados a todas las respuestas.
   * Basado en OWASP Secure Headers Project + mejores prácticas de Next.js.
   *
   * Nota PR2 (CSP nonce): Content-Security-Policy ya NO se setea aquí con
   * 'unsafe-inline'. El middleware (src/middleware.ts) genera un nonce
   * criptográfico por request y setea CSP con `script-src 'nonce-...'` +
   * strict-dynamic. Dejar CSP aquí causaría dos headers duplicados (el
   * navegador hace intersección y rompería el nonce). Por eso aquí solo
   * van los demás headers OWASP; CSP lo maneja el middleware.
   */
  async headers() {
    return [
      {
        // Aplicar a todas las rutas excepto archivos estáticos.
        source:
          "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
        headers: [
          {
            // Evita clickjacking: impide que la app se embeba en iframes externos.
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Evita MIME-sniffing en navegadores antiguos.
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Evita que el navegador infiera el referrer completo.
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // DNS prefetch: reduce latencia en fuentes externas.
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            // HSTS: fuerza HTTPS durante 1 año (incluye subdominios).
            // Solo efectivo cuando la app se sirve sobre HTTPS.
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            // Limita APIs sensibles del navegador.
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), geolocation=(), payment=(self), usb=()",
          },
          {
            // Evita que la página sea abierta como popup desde otro sitio.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            // Permite cargar recursos cross-origin pero no expone bytes.
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
