import { isMarketplacePropertyType } from '../config/property-types'
import { priceLimit, searchOptions } from '../config/search-filters'
import type { SearchState } from '../types/search'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

export const formatSearchCurrency = (value: number, locale: AppLocale = defaultLocale) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

export const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function buildSearchHref({ selectedSearch, searchDraft, priceRange }: SearchState) {
  const query: Record<string, string> = {}
  const location = searchDraft.location.trim() || selectedSearch.location
  if (location) query[searchOptions.location.query] = location
  if (isMarketplacePropertyType(selectedSearch.propertyType))
    query[searchOptions.propertyType.query] = selectedSearch.propertyType
  if (priceRange[0] > priceLimit.min || priceRange[1] < priceLimit.max)
    query[searchOptions.priceRange.query] = `${priceRange[0]}-${priceRange[1]}`

  return { pathname: '/properties', query } as const
}

export function parsePriceRange(value: string | undefined): {
  min: number | null
  max: number | null
} {
  const match = /^(\d+)-(\d+)$/.exec(value ?? '')
  if (!match) return { min: null, max: null }
  const [min, max] = [Number(match[1]), Number(match[2])]
  return {
    min: min > priceLimit.min ? min : null,
    max: max < priceLimit.max && max >= min ? max : null,
  }
}
