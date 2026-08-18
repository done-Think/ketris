'use client'

import { useCallback, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { priceLimit, searchOptions } from '../config/search-filters'
import { searchDraftSchema, type SearchDraftFormValues } from '../schemas/marketplace-search-schema'
import type {
  ActiveSearchMenu,
  PriceRange,
  SearchFilterKey,
  SelectedSearch,
  TextSearchFilterKey,
} from '../types/search'
import { buildSearchHref, formatSearchCurrency, normalizeSearchText } from '../utils/search'

export function useMarketplaceSearch() {
  const [activeSearchMenu, setActiveSearchMenu] = useState<ActiveSearchMenu>(null)
  const [selectedSearch, setSelectedSearch] = useState<SelectedSearch>({
    location: searchOptions.location.values[0],
    propertyType: searchOptions.propertyType.values[0],
    priceRange: searchOptions.priceRange.values[2],
  })
  const [priceRange, setPriceRange] = useState<PriceRange>([0, 10000])
  const { control, setValue: setSearchDraftValue } = useForm<SearchDraftFormValues>({
    resolver: zodResolver(searchDraftSchema),
    defaultValues: { location: '', propertyType: '' },
  })
  const searchDraft = useWatch({ control }) as SearchDraftFormValues

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
        setSearchDraftValue(key, value)
      }
      closeSearchMenu()
    },
    [closeSearchMenu, setSearchDraftValue],
  )

  const filterSearchOptions = useCallback(
    (key: TextSearchFilterKey) => {
      const query = normalizeSearchText(searchDraft[key])
      if (!query) return searchOptions[key].values

      return searchOptions[key].values.filter((value) => normalizeSearchText(value).includes(query))
    },
    [searchDraft],
  )

  const updatePriceRange = useCallback((nextRange: PriceRange) => {
    const [minValue, maxValue] = nextRange
    const normalizedMin = Math.max(priceLimit.min, Math.min(minValue, priceLimit.max))
    const normalizedMax = Math.max(priceLimit.min, Math.min(maxValue, priceLimit.max))
    const orderedRange: PriceRange =
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
    searchDraftControl: control,
    searchDraft,
    searchHref,
    selectedSearch,
    selectSearchValue,
    updatePriceRange,
  }
}
