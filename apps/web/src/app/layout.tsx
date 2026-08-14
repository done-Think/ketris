import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import 'maplibre-gl/dist/maplibre-gl.css'

import { Providers } from './providers'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-primary',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ketris',
  description:
    'Plataforma que conecta proprietários, corretores, imobiliárias, construtoras e locatários em uma única infraestrutura tecnológica.',
  icons: {
    icon: [
      { url: '/ketris-tab-icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={roboto.variable} style={{ width: '100%', overflowX: 'clip' }}>
      <body style={{ width: '100%', overflowX: 'clip' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
