import routeRedirects from '@/i18n/route-redirects.json'
import { routing } from '@/i18n/routing'
import type { AuthNavigationHref } from '../types/navigation'

export function getAuthDestination(
  callbackUrl: string,
  origin = 'https://ketris.invalid',
): AuthNavigationHref {
  const base = new URL(origin).origin
  try {
    const url = new URL(callbackUrl, base)
    if (url.origin !== base) return '/dashboard'
    let pathname =
      routeRedirects.find((redirect) => redirect.source === url.pathname)?.destination ??
      url.pathname
    const prefixes =
      typeof routing.localePrefix === 'object' && 'prefixes' in routing.localePrefix
        ? Object.values(routing.localePrefix.prefixes ?? {})
        : []
    for (const prefix of prefixes) {
      if (typeof prefix !== 'string') continue
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        pathname = pathname.slice(prefix.length) || '/'
        break
      }
    }
    for (const [route, localized] of Object.entries(routing.pathnames)) {
      const variants =
        typeof localized === 'string' ? [route, localized] : [route, ...Object.values(localized)]
      for (const variant of variants) {
        const pattern = variant.split('/').filter(Boolean)
        const segments = pathname.split('/').filter(Boolean)
        if (pattern.length !== segments.length) continue
        const params: Record<string, string> = {}
        const matches = pattern.every((part, index) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            params[part.slice(1, -1)] = decodeURIComponent(segments[index])
            return true
          }
          return part === segments[index]
        })
        if (!matches) continue
        const query: Record<string, string | string[]> = {}
        for (const [key, value] of url.searchParams) {
          const current = query[key]
          query[key] =
            current === undefined
              ? value
              : [...(Array.isArray(current) ? current : [current]), value]
        }
        if (Object.keys(params).length === 0 && !url.search) return route as AuthNavigationHref
        return {
          pathname: route,
          ...(Object.keys(params).length ? { params } : {}),
          ...(url.search ? { query } : {}),
        } as AuthNavigationHref
      }
    }
  } catch {
    return '/dashboard'
  }
  return '/dashboard'
}
