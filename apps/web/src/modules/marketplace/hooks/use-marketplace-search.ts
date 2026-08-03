'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  priceLimit,
  searchOptions,
  type SearchFilterKey,
  type TextSearchFilterKey,
} from '../config/search-filters'
import { buildSearchHref, formatSearchCurrency, normalizeSearchText } from '../utils/search'

export function useMarketplaceSearch() {
  const [selectedSearch, setSelectedSearch] = useState<Record<SearchFilterKey, string>>({
    location: searchOptions.location.values[0],
    propertyType: searchOptions.propertyType.values[0],
    priceRange: searchOptions.priceRange.values[2],
  })
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [activeSearchMenu, setActiveSearchMenu] = useState<SearchFilterKey | null>(null)
  const [searchDraft, setSearchDraft] = useState<Record<TextSearchFilterKey, string>>({
    location: '',
    propertyType: '',
  })

  const openSearchMenu = useCallback((key: SearchFilterKey) => {
    setActiveSearchMenu((current) => (current === key ? null : key))
  }, [])

  const closeSearchMenu = useCallback(() => {
    setActiveSearchMenu(null)
  }, [])

  const selectSearchValue = useCallback(
    (key: SearchFilterKey, value: string) => {
      setSelectedSearch((current) => ({ ...current, [key]: value }))
      if (key !== 'priceRange') {
        setSearchDraft((current) => ({ ...current, [key]: value }))
      }
      closeSearchMenu()
    },
    [closeSearchMenu],
  )

  const filterSearchOptions = useCallback(
    (key: TextSearchFilterKey) => {
      const query = normalizeSearchText(searchDraft[key])
      if (!query) return searchOptions[key].values

      return searchOptions[key].values.filter((value) => normalizeSearchText(value).includes(query))
    },
    [searchDraft],
  )

  const updatePriceRange = useCallback((nextRange: [number, number]) => {
    const [minValue, maxValue] = nextRange
    const normalizedMin = Math.max(priceLimit.min, Math.min(minValue, priceLimit.max))
    const normalizedMax = Math.max(priceLimit.min, Math.min(maxValue, priceLimit.max))
    const orderedRange: [number, number] =
      normalizedMin <= normalizedMax
        ? [normalizedMin, normalizedMax]
        : [normalizedMax, normalizedMin]

    setPriceRange(orderedRange)
    setSelectedSearch((current) => ({
      ...current,
      priceRange: `${orderedRange[0]}-${orderedRange[1]}`,
    }))
  }, [])

  const priceRangeLabel = `${formatSearchCurrency(priceRange[0])} - ${formatSearchCurrency(
    priceRange[1],
  )}`

  const searchHref = useMemo(
    () => buildSearchHref({ selectedSearch, searchDraft, priceRange }),
    [priceRange, searchDraft, selectedSearch],
  )

  return {
    activeSearchMenu,
    closeSearchMenu,
    filterSearchOptions,
    openSearchMenu,
    priceRange,
    priceRangeLabel,
    searchDraft,
    searchHref,
    selectedSearch,
    selectSearchValue,
    setSearchDraft,
    updatePriceRange,
  }
}
