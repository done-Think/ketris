'use client'

import { useCallback, useMemo, type SetStateAction } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { priceLimit, searchOptions } from '../config/search-filters'
import { marketplaceSearchFormSchema } from '../schemas/marketplace-search-schema'
import type {
  MarketplaceSearchFormValues,
  PriceRange,
  SearchDraft,
  SearchFilterKey,
  TextSearchFilterKey,
} from '../types/search'
import { buildSearchHref, formatSearchCurrency, normalizeSearchText } from '../utils/search'

export function useMarketplaceSearch() {
  const { getValues, setValue, watch } = useForm<MarketplaceSearchFormValues>({
    defaultValues: {
      activeSearchMenu: null,
      selectedSearch: {
        location: searchOptions.location.values[0],
        propertyType: searchOptions.propertyType.values[0],
        priceRange: searchOptions.priceRange.values[2],
      },
      priceRange: [0, 10000],
      searchDraft: {
        location: '',
        propertyType: '',
      },
    },
    resolver: zodResolver(marketplaceSearchFormSchema),
  })
  const { activeSearchMenu, priceRange, searchDraft, selectedSearch } = watch()

  const openSearchMenu = useCallback(
    (key: SearchFilterKey) => {
      setValue('activeSearchMenu', getValues('activeSearchMenu') === key ? null : key)
    },
    [getValues, setValue],
  )

  const closeSearchMenu = useCallback(() => {
    setValue('activeSearchMenu', null)
  }, [setValue])

  const selectSearchValue = useCallback(
    (key: SearchFilterKey, value: string) => {
      setValue('selectedSearch', { ...getValues('selectedSearch'), [key]: value })
      if (key !== 'priceRange') {
        setValue('searchDraft', { ...getValues('searchDraft'), [key]: value })
      }
      closeSearchMenu()
    },
    [closeSearchMenu, getValues, setValue],
  )

  const setSearchDraft = useCallback(
    (nextSearchDraft: SetStateAction<SearchDraft>) => {
      const currentSearchDraft = getValues('searchDraft')
      const value =
        typeof nextSearchDraft === 'function'
          ? nextSearchDraft(currentSearchDraft)
          : nextSearchDraft

      setValue('searchDraft', value)
    },
    [getValues, setValue],
  )

  const filterSearchOptions = useCallback(
    (key: TextSearchFilterKey) => {
      const query = normalizeSearchText(searchDraft[key])
      if (!query) return searchOptions[key].values

      return searchOptions[key].values.filter((value) => normalizeSearchText(value).includes(query))
    },
    [searchDraft],
  )

  const updatePriceRange = useCallback(
    (nextRange: PriceRange) => {
      const [minValue, maxValue] = nextRange
      const normalizedMin = Math.max(priceLimit.min, Math.min(minValue, priceLimit.max))
      const normalizedMax = Math.max(priceLimit.min, Math.min(maxValue, priceLimit.max))
      const orderedRange: PriceRange =
        normalizedMin <= normalizedMax
          ? [normalizedMin, normalizedMax]
          : [normalizedMax, normalizedMin]

      setValue('priceRange', orderedRange)
      setValue('selectedSearch', {
        ...getValues('selectedSearch'),
        priceRange: `${orderedRange[0]}-${orderedRange[1]}`,
      })
    },
    [getValues, setValue],
  )

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
