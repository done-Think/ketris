import type { AppLocale } from './types/locale.types'

export const localeCookieName = 'NEXT_LOCALE'
export const localeCookieMaxAge = 60 * 60 * 24 * 365
export const localeCookiePath = '/'
export const localeCookieSameSite = 'lax'

export function syncClientLocaleCookie(locale: AppLocale) {
  document.cookie = `${localeCookieName}=${encodeURIComponent(locale)};path=${localeCookiePath};max-age=${localeCookieMaxAge};SameSite=${localeCookieSameSite}`
}
