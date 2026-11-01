import { getPathname } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/types/locale.types'

export function phoneCaptureUrl(href: string, token: string, locale: AppLocale): string | null {
  try {
    const origin = new URL(href)
    const hostname = origin.hostname
    if (
      origin.protocol !== 'https:' ||
      origin.username ||
      origin.password ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '[::1]' ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname) ||
      !/^[a-f0-9]{64}$/.test(token)
    )
      return null
    return new URL(
      getPathname({
        locale,
        href: { pathname: '/face_check/verify/[token]', params: { token } },
      }),
      origin.origin,
    ).href
  } catch {
    return null
  }
}
