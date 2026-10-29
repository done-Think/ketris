import type { Metadata } from 'next'

import { env } from '@config/env'
import { buildCreciNumberSlug, buildPublicProfileSlug } from '@shared/utils/public-profile-slug'
import { getPathname } from './navigation'
import type { NavigationHref } from './current-route'
import { defaultLocale, locales, resolveLocale } from './routing'

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false },
}

export function getSiteOrigin() {
  const url = new URL(env.appUrl)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('NEXT_PUBLIC_APP_URL must be a public HTTP(S) application URL.')
  }
  return url.origin
}

export function isPublicIndexingEnabled() {
  const hostname = new URL(getSiteOrigin()).hostname
  return (
    env.environment === 'production' &&
    process.env.VERCEL_ENV !== 'preview' &&
    !['localhost', '127.0.0.1', '[::1]'].includes(hostname)
  )
}

export function getPublicAlternates(locale: string | undefined, href: NavigationHref) {
  const origin = getSiteOrigin()
  const localizedUrl = (language: (typeof locales)[number]) =>
    new URL(getPathname({ locale: language, href }), origin).href

  return {
    canonical: localizedUrl(resolveLocale(locale)),
    languages: {
      ...Object.fromEntries(locales.map((language) => [language, localizedUrl(language)])),
      'x-default': localizedUrl(defaultLocale),
    },
  }
}

export function publicMetadata(locale: string | undefined, href: NavigationHref): Metadata {
  const alternates = getPublicAlternates(locale, href)
  const index = isPublicIndexingEnabled()
  return {
    alternates,
    robots: { index, follow: index },
    openGraph: { url: alternates.canonical },
  }
}

export function getAgencyProfileHref(
  displayName: string,
  legalCreci: string | null,
  id: string,
): NavigationHref {
  const slug = buildPublicProfileSlug(displayName)
  const creci = buildCreciNumberSlug(legalCreci)
  return slug && creci
    ? { pathname: '/agencies/[id]/[creci]', params: { id: slug, creci } }
    : { pathname: '/agencies/[id]', params: { id } }
}
