import 'maplibre-gl/dist/maplibre-gl.css'
import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'

import { Providers } from './providers'
import { defaultTimeZone } from '@/i18n/formats'
import { defaultLocale, isAppLocale } from '@/i18n/routing'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-primary',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.metadata')

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: [
        { url: '/ketris-tab-icon.png', type: 'image/png', sizes: '512x512' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-icon.png',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentLocale = await getLocale()
  const locale = isAppLocale(currentLocale) ? currentLocale : defaultLocale
  const messages = await getMessages({ locale })

  return (
    <html lang={locale} className={roboto.variable}>
      <body>
        <Providers i18n={{ locale, messages, timeZone: defaultTimeZone }}>{children}</Providers>
      </body>
    </html>
  )
}
