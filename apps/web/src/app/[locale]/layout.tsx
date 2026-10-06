import 'maplibre-gl/dist/maplibre-gl.css'
import type { Metadata } from 'next'
import { getMessages, getTranslations } from 'next-intl/server'
import { Roboto, Space_Grotesk } from 'next/font/google'
import { notFound } from 'next/navigation'
import { locale as getRootLocale } from 'next/root-params'

import { defaultTimeZone } from '@/i18n/formats'
import { isAppLocale, locales } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { LocaleLayoutProps } from '@/i18n/types/route.types'
import { LocaleProviders, Providers } from '../providers'

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale: routeLocale } = await params
  const locale = getValidatedLocale(routeLocale)
  const t = await getTranslations({ locale, namespace: 'common.metadata' })

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

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: routeLocale } = await params
  const locale = getValidatedLocale(routeLocale)
  const messages = await getMessages({ locale })

  return (
    <html
      lang={await getValidatedRootLocale()}
      className={`${roboto.variable} ${spaceGrotesk.variable}`}
    >
      <body suppressHydrationWarning>
        <LocaleProviders i18n={{ locale, messages, timeZone: defaultTimeZone }}>
          <Providers>{children}</Providers>
        </LocaleProviders>
      </body>
    </html>
  )
}

async function getValidatedRootLocale(): Promise<AppLocale> {
  return getValidatedLocale(await getRootLocale())
}

function getValidatedLocale(locale: string): AppLocale {
  if (!isAppLocale(locale)) notFound()

  return locale
}
