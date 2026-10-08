import { searchFilterOrder, searchOptions } from '../config/search-filters'
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
  const params = new URLSearchParams()

  searchFilterOrder.forEach((key) => {
    const value =
      key === 'priceRange'
        ? `${priceRange[0]}-${priceRange[1]}`
        : searchDraft[key].trim() || selectedSearch[key]

    params.set(searchOptions[key].query, value)
  })

  return {
    pathname: '/properties',
    query: Object.fromEntries(params.entries()),
  } as const
}
