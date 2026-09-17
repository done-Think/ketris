import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Roboto } from 'next/font/google'
import { locale as getRootLocale } from 'next/root-params'
import { getMessages, getTranslations } from 'next-intl/server'
import 'maplibre-gl/dist/maplibre-gl.css'

import { LocaleProviders, Providers } from '../providers'
import { defaultTimeZone } from '@/i18n/formats'
import { locales, isAppLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { LocaleLayoutProps } from '@/i18n/types/route.types'

// Roboto é fonte variável: um único arquivo cobre 100..900. Declarar pesos explícitos
// gerava 4 @font-face por subset (37 no total) apontando para os mesmos 9 arquivos.
const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-primary',
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
    <html lang={await getValidatedRootLocale()} className={roboto.variable}>
      {/* Extensões de browser (ColorZilla, Grammarly, etc.) injetam atributos no body
          antes da hidratação. Suprime só os atributos/texto DESTE elemento — divergências
          nos filhos continuam sendo reportadas. */}
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
