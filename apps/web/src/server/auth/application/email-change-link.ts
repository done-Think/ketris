import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

export function buildEmailChangeLink(requestId: string, locale: AppLocale): string {
  const origin = new URL(process.env.NEXTAUTH_URL ?? '')
  if (!['http:', 'https:'].includes(origin.protocol)) {
    throw new Error('NEXTAUTH_URL precisa definir uma origem HTTP ou HTTPS válida.')
  }
  const configuration = routing.localePrefix
  const prefix =
    typeof configuration === 'object' && 'prefixes' in configuration
      ? (configuration.prefixes?.[locale] ?? `/${locale}`)
      : `/${locale}`
  const pathname = `${prefix}${routing.pathnames['/confirm-email-change']}`
  const url = new URL(pathname, origin.origin)
  url.searchParams.set('request', requestId)
  return url.toString()
}
