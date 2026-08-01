import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Providers } from './providers'
import 'maplibre-gl/dist/maplibre-gl.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ketris',
  description:
    'Plataforma que conecta proprietários, corretores, imobiliárias, construtoras e locatários em uma única infraestrutura tecnológica.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/ketris-tab-icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      style={{ width: '100%', overflowX: 'clip' }}
    >
      <body style={{ width: '100%', overflowX: 'clip' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
