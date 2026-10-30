'use client'

import { useCallback, useMemo, useState, type SetStateAction } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'

import { isMarketplacePropertyType, propertyTypeLabelKeys } from '../config/property-types'
import { searchOptions } from '../config/search-filters'
import { defaultSearchPurpose } from '../config/home'
import type {
  PriceRange,
  SearchDraft,
  SearchResultPurposeParam,
  SearchFilterKey,
  SelectedSearch,
  TextSearchFilterKey,
} from '../types/search'
import {
  buildSearchHref,
  formatSearchCurrency,
  normalizeSearchText,
  isValidPriceRange,
} from '../utils/search'

const emptySelection: SelectedSearch = { location: '', propertyType: '' }
const emptyDraft: SearchDraft = { location: '', propertyType: '' }
const emptyLocations: readonly string[] = []

export function useMarketplaceSearch(locations: readonly string[] = emptyLocations) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace.home.search')
  const typeT = useTranslations('marketplace.propertyDetail.categories')
  const [activeSearchMenu, setActiveSearchMenu] = useState<SearchFilterKey | null>(null)
  const [selectedSearch, setSelectedSearch] = useState<SelectedSearch>(emptySelection)
  const [searchDraft, setSearchDraftState] = useState<SearchDraft>(emptyDraft)
  const [purpose, setPurpose] = useState<SearchResultPurposeParam>(defaultSearchPurpose)
  const [priceRange, setPriceRange] = useState<PriceRange>([null, null])

  const openSearchMenu = useCallback(
    (key: SearchFilterKey) => setActiveSearchMenu((current) => (current === key ? null : key)),
    [],
  )
  const closeSearchMenu = useCallback(() => setActiveSearchMenu(null), [])

  const selectSearchValue = useCallback(
    (key: TextSearchFilterKey, value: string) => {
      setSelectedSearch((current) => ({ ...current, [key]: value }))
      setSearchDraftState((current) => ({ ...current, [key]: '' }))
      closeSearchMenu()
    },
    [closeSearchMenu],
  )

  const setSearchDraft = useCallback(
    (next: SetStateAction<SearchDraft>) => setSearchDraftState(next),
    [],
  )

  const getSearchOptionLabel = useCallback(
    (key: TextSearchFilterKey, value: string) => {
      if (key === 'propertyType')
        return isMarketplacePropertyType(value)
          ? typeT(propertyTypeLabelKeys[value])
          : t('anyPropertyType')

      return value || t('anyLocation')
    },
    [t, typeT],
  )

  const filterSearchOptions = useCallback(
    (key: TextSearchFilterKey): readonly string[] => {
      const query = normalizeSearchText(searchDraft[key])
      const values: readonly string[] = key === 'location' ? locations : searchOptions[key].values
      if (!query) return values

      return values.filter((value) =>
        normalizeSearchText(getSearchOptionLabel(key, value)).includes(query),
      )
    },
    [getSearchOptionLabel, searchDraft, locations],
  )

  const updatePriceRange = useCallback((nextRange: PriceRange) => {
    if (isValidPriceRange(nextRange)) setPriceRange(nextRange)
  }, [])

  const [minPrice, maxPrice] = priceRange
  const priceRangeLabel =
    minPrice !== null && maxPrice !== null
      ? `${formatSearchCurrency(minPrice, locale)} - ${formatSearchCurrency(maxPrice, locale)}`
      : maxPrice !== null
        ? t('upToPrice', { price: formatSearchCurrency(maxPrice, locale) })
        : minPrice !== null
          ? t('fromPrice', { price: formatSearchCurrency(minPrice, locale) })
          : t('anyPrice')

  const searchHref = useMemo(
    () => buildSearchHref({ selectedSearch, searchDraft, priceRange, purpose }),
    [priceRange, purpose, searchDraft, selectedSearch],
  )

  return {
    activeSearchMenu,
    closeSearchMenu,
    filterSearchOptions,
    getSearchOptionLabel,
    openSearchMenu,
    priceRange,
    priceRangeLabel,
    purpose,
    searchDraft,
    searchHref,
    selectedSearch,
    selectSearchValue,
    setPurpose,
    setSearchDraft,
    updatePriceRange,
  }
}
