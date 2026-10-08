import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from '../components/posthog-provider';
import { BRAND } from '../lib/branding';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.app.url),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    'Plataforma de fitness para planificar entrenamientos, registrar sesiones, analizar progreso y conectar atletas con coaches.',
  keywords: [
    'fitness',
    'entrenamiento',
    'nutrición',
    'gimnasio',
    'workout',
    'app fitness',
    'coach fitness',
    'rutinas personalizadas',
    'seguimiento de progreso',
    BRAND.name,
  ],
  authors: [{ name: `${BRAND.name} Team`, url: BRAND.app.url }],
  creator: BRAND.name,
  publisher: BRAND.name,
  applicationName: BRAND.name,
  category: 'Health & Fitness',
  formatDetection: { email: false, address: false, telephone: false },
  manifest: '/manifest.json',
  alternates: {
    canonical: BRAND.app.url,
    languages: {
      es: `${BRAND.app.url}/es`,
      en: `${BRAND.app.url}/en`,
      'x-default': `${BRAND.app.url}/es`,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: BRAND.name,
  },
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      'Entrenamiento, progreso y coaching en una experiencia unificada.',
    type: 'website',
    locale: 'es_AR',
    alternateLocale: ['en_US'],
    url: BRAND.app.url,
    siteName: BRAND.name,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${BRAND.name} — plataforma de fitness`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: 'Entrenamiento, progreso y coaching en una experiencia unificada.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.colors.dark,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'dark',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BRAND.app.url}/#organization`,
      name: BRAND.name,
      url: BRAND.app.url,
      logo: {
        '@type': 'ImageObject',
        url: `${BRAND.app.url}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
      },
      description:
        'Plataforma de fitness para entrenamiento, progreso y coaching.',
      brand: BRAND.name,
      contactPoint: {
        '@type': 'ContactPoint',
        email: BRAND.support.email,
        contactType: 'customer support',
        availableLanguage: ['Spanish', 'English'],
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BRAND.app.url}/#software`,
      name: BRAND.name,
      operatingSystem: 'Web, iOS, Android',
      applicationCategory: 'HealthApplication',
      description:
        'Aplicación de fitness para programación, registro de entrenamientos, progreso, seguimiento de clientes y coaching asistido por IA.',
      url: BRAND.app.url,
      image: `${BRAND.app.url}/opengraph-image`,
      author: { '@id': `${BRAND.app.url}/#organization` },
      publisher: { '@id': `${BRAND.app.url}/#organization` },
      isAccessibleForFree: true,
    },
    {
      '@type': 'WebSite',
      '@id': `${BRAND.app.url}/#website`,
      name: BRAND.name,
      url: BRAND.app.url,
      description: 'Experiencia web de KinetixFitt.',
      publisher: { '@id': `${BRAND.app.url}/#organization` },
      inLanguage: ['es-AR', 'en-US'],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="alternate" hrefLang="es" href={`${BRAND.app.url}/es`} />
        <link rel="alternate" hrefLang="en" href={`${BRAND.app.url}/en`} />
        <link rel="alternate" hrefLang="x-default" href={`${BRAND.app.url}/es`} />
        <script
          dangerouslySetInnerHTML={{
            __html:
              `try{var p=location.pathname;var m=p.match(/^\\/(en|es)(\\/|$)/);var c=document.cookie.match(/(?:^|; )NEXT_LOCALE=(en|es)/);var l=m?m[1]:c?c[1]:((navigator.language||'es').slice(0,2));if(l!=='en'&&l!=='es')l='es';document.documentElement.lang=l;}catch(e){}`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
