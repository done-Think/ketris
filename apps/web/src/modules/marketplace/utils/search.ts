import {
  searchFilterOrder,
  searchOptions,
  type SearchFilterKey,
  type TextSearchFilterKey,
} from '../config/search-filters'

type SearchState = {
  selectedSearch: Record<SearchFilterKey, string>
  searchDraft: Record<TextSearchFilterKey, string>
  priceRange: [number, number]
}

export const formatSearchCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
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

  return `/imoveis?${params.toString()}`
}
