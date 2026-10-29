import { getPathname } from './navigation'
import { routing } from './routing'
import type { AppLocale } from './types/locale.types'

export type NavigationHref = Parameters<typeof getPathname>[0]['href']
type InternalPathname = keyof typeof routing.pathnames
type StaticPathname = Exclude<InternalPathname, `${string}[${string}`>

function isStaticPathname(pathname: string): pathname is StaticPathname {
  return Object.hasOwn(routing.pathnames, pathname) && !pathname.includes('[')
}

export function getCurrentRouteHref(
  pathname: string,
  params: Record<string, string | string[] | undefined>,
  searchParams: URLSearchParams,
): NavigationHref {
  const query: Record<string, string | string[]> = {}
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key)
    query[key] = values.length === 1 ? values[0] : values
  }
  const queryOptions = Object.keys(query).length ? { query } : {}
  if (isStaticPathname(pathname)) {
    // Static routes need no params; the discriminated union is preserved here.
    const href = { pathname, ...queryOptions } as NavigationHref
    return href
  }

  const id = typeof params.id === 'string' ? params.id : undefined
  if (!id) return { pathname: '/', ...queryOptions }

  switch (pathname) {
    case '/properties/[id]':
      return { pathname, params: { id }, ...queryOptions }
    case '/brokers/[id]':
      return { pathname, params: { id }, ...queryOptions }
    case '/agencies/[id]':
      return { pathname, params: { id }, ...queryOptions }
    case '/agencies/[id]/[creci]': {
      const creci = typeof params.creci === 'string' ? params.creci : undefined
      return creci
        ? { pathname, params: { id, creci }, ...queryOptions }
        : { pathname: '/agencies', ...queryOptions }
    }
    case '/crm/opportunities/[id]':
      return { pathname, params: { id }, ...queryOptions }
    case '/dashboard/contracts/[id]':
      return { pathname, params: { id }, ...queryOptions }
    case '/dashboard/finance/charges/[id]':
      return { pathname, params: { id }, ...queryOptions }
    case '/dashboard/maintenance/[id]':
      return { pathname, params: { id }, ...queryOptions }
    case '/dashboard/properties/[id]':
      return { pathname, params: { id }, ...queryOptions }
    case '/dashboard/properties/[id]/edit':
      return { pathname, params: { id }, ...queryOptions }
    case '/platform/tenants/[id]':
      return { pathname, params: { id }, ...queryOptions }
    default:
      return { pathname: '/', ...queryOptions }
  }
}

export function getLocaleChangePathname(locale: AppLocale, href: NavigationHref, hash = '') {
  // next-intl currently omits UrlObject.hash when compiling a localized pathname.
  return `${getPathname({ locale, href })}${hash}`
}
