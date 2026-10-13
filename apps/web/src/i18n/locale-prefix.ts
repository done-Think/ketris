import { defaultLocale, isAppLocale } from './routing'
import type { AppLocale } from './types/locale.types'

const localePathPrefixes = {
  'pt-BR': '/pt',
  'en-US': '/en',
  'es-ES': '/es',
} as const satisfies Record<AppLocale, `/${string}`>

const localePrefixes = Object.values(localePathPrefixes)

const localizedPublicPathnames = [
  {
    'pt-BR': '/dashboard/agenda',
    'en-US': '/dashboard/schedule',
    'es-ES': '/dashboard/agenda',
  },
  {
    'pt-BR': '/imoveis',
    'en-US': '/properties',
    'es-ES': '/inmuebles',
  },
  {
    'pt-BR': '/corretores',
    'en-US': '/brokers',
    'es-ES': '/corredores',
  },
  {
    'pt-BR': '/imobiliarias',
    'en-US': '/agencies',
    'es-ES': '/inmobiliarias',
  },
] as const satisfies Array<Record<AppLocale, `/${string}`>>

function hasLocalePathPrefix(pathname: string) {
  return localePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function getLocalePathPrefix(locale: string | undefined) {
  if (locale === 'pt') return localePathPrefixes['pt-BR']
  if (locale === 'en') return localePathPrefixes['en-US']
  if (locale === 'es') return localePathPrefixes['es-ES']

  const appLocale = isAppLocale(locale) ? locale : defaultLocale

  return localePathPrefixes[appLocale]
}

export function getLocalizedPathname(pathname: string, locale: string | undefined) {
  const appLocale = isAppLocale(locale) ? locale : defaultLocale
  const prefix = getLocalePathPrefix(locale)

  if (!pathname.startsWith('/')) return pathname
  if (hasLocalePathPrefix(pathname)) return pathname
  if (pathname === '/') return prefix

  return `${prefix}${translatePathnameForLocale(pathname, appLocale)}`
}

export function getLocaleFromPathname(pathname: string): AppLocale | undefined {
  if (pathname === '/pt' || pathname.startsWith('/pt/')) return 'pt-BR'
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en-US'
  if (pathname === '/es' || pathname.startsWith('/es/')) return 'es-ES'

  return undefined
}

export function getLocalizedPathnameForLocale(pathname: string, locale: AppLocale) {
  const normalizedPathname = removeLocalePathPrefix(pathname) || '/'
  const prefix = getLocalePathPrefix(locale)

  if (normalizedPathname === '/') return prefix

  return `${prefix}${translatePathnameForLocale(normalizedPathname, locale)}`
}

function translatePathnameForLocale(pathname: string, locale: AppLocale) {
  for (const publicPathnames of localizedPublicPathnames) {
    const currentBasePathname = Object.values(publicPathnames).find(
      (publicPathname) => pathname === publicPathname || pathname.startsWith(`${publicPathname}/`),
    )

    if (!currentBasePathname) continue

    const suffix = pathname.slice(currentBasePathname.length)

    return `${publicPathnames[locale]}${suffix}`
  }

  return pathname
}

function removeLocalePathPrefix(pathname: string) {
  return pathname.replace(/^\/(pt|en|es|pt-BR|en-US|es-ES)(?=\/|$)/, '')
}
