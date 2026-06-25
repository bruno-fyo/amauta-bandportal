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

export const metadata: Metadata = {
  title: 'Centro de Recursos Amauta',
  description:
    'Portal oficial de recursos de marca, productos y comunicación de Amauta. Todo el material en un único lugar.',
  generator: 'v0.app',
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
