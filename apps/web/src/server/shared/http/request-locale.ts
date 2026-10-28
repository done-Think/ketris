import { localeCookieName } from '@/i18n/locale-cookie'
import { defaultLocale, locales } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

function supportedLocale(value: string): AppLocale | undefined {
  const normalized = value.toLowerCase()
  return (
    locales.find((locale) => locale.toLowerCase() === normalized) ??
    locales.find((locale) => locale.split('-')[0] === normalized.split('-')[0])
  )
}

export function resolveRequestLocale(
  request?: Pick<Request, 'headers'>,
  fallback: AppLocale = defaultLocale,
): AppLocale {
  const cookie = request?.headers
    .get('cookie')
    ?.split(';')
    .find((part) => part.trim().startsWith(`${localeCookieName}=`))
  if (cookie) {
    try {
      const locale = supportedLocale(
        decodeURIComponent(cookie.trim().slice(localeCookieName.length + 1)),
      )
      if (locale) return locale
    } catch {
      // Invalid cookie encoding does not prevent header negotiation.
    }
  }
  const preferences = (request?.headers.get('accept-language') ?? '')
    .split(',')
    .map((entry, index) => {
      const [language = '', ...parameters] = entry.trim().split(';')
      const qualityText = parameters.find((parameter) => parameter.trim().startsWith('q='))
      const quality = qualityText ? Number(qualityText.trim().slice(2)) : 1
      return { locale: supportedLocale(language), quality, index }
    })
    .filter((entry) => Number.isFinite(entry.quality) && entry.quality > 0 && entry.quality <= 1)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)
  return preferences.find((entry) => entry.locale)?.locale ?? fallback
}
