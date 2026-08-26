import type { LocalizedHref } from '@shared/types/localized-href'
import type { PropertyBreadcrumbOriginType } from '../types/property-detail'
import type { SearchResultPurpose } from '../types/search'

const marketplacePathnameReplacements = [
  { source: /^\/imoveis(?=\/|$)/, target: '/properties' },
  { source: /^\/corretores(?=\/|$)/, target: '/brokers' },
  { source: /^\/imobiliarias(?=\/|$)/, target: '/agencies' },
] as const

export function getInternalMarketplaceHref(href: string) {
  return marketplacePathnameReplacements.reduce(
    (currentHref, replacement) => currentHref.replace(replacement.source, replacement.target),
    href,
  )
}

export function getSearchPurposeParam(purpose: SearchResultPurpose) {
  return purpose === 'comprar' ? 'buy' : 'rent'
}

function getHrefLastSegment(href: string) {
  return href.split('?')[0].split('/').filter(Boolean).at(-1) ?? ''
}

export function buildPropertyDetailHref(href: string, purpose: SearchResultPurpose): LocalizedHref {
  return {
    pathname: '/properties/[id]',
    params: { id: getHrefLastSegment(href) },
    query: { purpose: getSearchPurposeParam(purpose) },
  }
}

export function buildProfileListingHref(
  href: string,
  source?: {
    href: string
    name: string
    type: PropertyBreadcrumbOriginType
  },
): LocalizedHref {
  const query = source
    ? {
        source: source.type,
        sourceHref: getInternalMarketplaceHref(source.href),
        sourceName: source.name,
      }
    : undefined

  return {
    pathname: '/properties/[id]',
    params: { id: getHrefLastSegment(href) },
    query,
  }
}

export function buildPublicProfileHref(
  href: string,
  originType: PropertyBreadcrumbOriginType,
): LocalizedHref {
  const id = getHrefLastSegment(href)

  if (originType === 'broker') {
    return {
      pathname: '/brokers/[id]',
      params: { id },
    }
  }

  return {
    pathname: '/agencies/[id]',
    params: { id },
  }
}

export function isSafeMarketplaceOriginHref(
  href: string | undefined,
  originType: PropertyBreadcrumbOriginType | undefined,
) {
  if (!href?.startsWith('/')) return false
  if (href.startsWith('//')) return false

  const internalHref = getInternalMarketplaceHref(href)

  if (originType === 'broker') return internalHref.startsWith('/brokers/')
  if (originType === 'agency') return internalHref.startsWith('/agencies/')

  return false
}
