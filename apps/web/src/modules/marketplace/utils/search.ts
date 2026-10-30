import { formatCurrency } from '@shared/lib/utils/format'
import { isMarketplacePropertyType } from '../config/property-types'
import { searchOptions } from '../config/search-filters'
import type { PriceRange, SearchState } from '../types/search'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

export const formatSearchCurrency = (value: number, locale: AppLocale = defaultLocale) =>
  formatCurrency(value, locale, { maximumFractionDigits: 2, minimumFractionDigits: 0 })

export const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function buildSearchHref({ selectedSearch, searchDraft, priceRange, purpose }: SearchState) {
  const query: Record<string, string> = {}
  if (purpose) query.purpose = purpose
  const location = searchDraft.location.trim() || selectedSearch.location
  if (location) query[searchOptions.location.query] = location
  if (isMarketplacePropertyType(selectedSearch.propertyType))
    query[searchOptions.propertyType.query] = selectedSearch.propertyType
  if (isValidPriceRange(priceRange) && (priceRange[0] !== null || priceRange[1] !== null))
    query[searchOptions.priceRange.query] = `${priceRange[0] ?? ''}-${priceRange[1] ?? ''}`

  return { pathname: '/properties', query } as const
}

export function parsePriceRange(value: string | undefined): {
  min: number | null
  max: number | null
} {
  const match = /^(\d*(?:\.\d+)?)-(\d*(?:\.\d+)?)$/.exec(value ?? '')
  if (!match) return { min: null, max: null }
  const [min, max] = match.slice(1).map((bound) => (bound === '' ? null : Number(bound)))
  return isValidPriceRange([min, max]) ? { min, max } : { min: null, max: null }
}

export function isValidPriceRange([min, max]: PriceRange) {
  return (
    [min, max].every((bound) => bound === null || (Number.isFinite(bound) && bound >= 0)) &&
    (min === null || max === null || min <= max)
  )
}
