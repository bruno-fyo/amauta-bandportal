import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Titillium_Web, Geist_Mono } from 'next/font/google'
import './globals.css'

const titillium = Titillium_Web({
  variable: '--font-titillium',
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000'

const siteTitle = 'Centro de Recursos Amauta'
const siteDescription =
  'Portal oficial de recursos de marca, productos y comunicación de Amauta. Todo el material en un único lugar.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fcfaf7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${titillium.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
