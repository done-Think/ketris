'use client'

import { useCallback, useMemo, useState, type SetStateAction } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'

import { isMarketplacePropertyType, propertyTypeLabelKeys } from '../config/property-types'
import { priceLimit, searchOptions } from '../config/search-filters'
import type {
  PriceRange,
  SearchDraft,
  SearchResultPurposeParam,
  SearchFilterKey,
  SelectedSearch,
  TextSearchFilterKey,
} from '../types/search'
import { buildSearchHref, formatSearchCurrency, normalizeSearchText } from '../utils/search'

const emptySelection: SelectedSearch = { location: '', propertyType: '' }
const emptyDraft: SearchDraft = { location: '', propertyType: '' }

export function useMarketplaceSearch() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace.home.search')
  const typeT = useTranslations('marketplace.propertyDetail.categories')
  const [activeSearchMenu, setActiveSearchMenu] = useState<SearchFilterKey | null>(null)
  const [selectedSearch, setSelectedSearch] = useState<SelectedSearch>(emptySelection)
  const [searchDraft, setSearchDraftState] = useState<SearchDraft>(emptyDraft)
  const [purpose, setPurpose] = useState<SearchResultPurposeParam>('rent')
  const [priceRange, setPriceRange] = useState<PriceRange>([priceLimit.min, priceLimit.max])

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
      const values: readonly string[] = searchOptions[key].values
      if (!query) return values

      return values.filter((value) =>
        normalizeSearchText(getSearchOptionLabel(key, value)).includes(query),
      )
    },
    [getSearchOptionLabel, searchDraft],
  )

  const updatePriceRange = useCallback((nextRange: PriceRange) => {
    const [minValue, maxValue] = nextRange.map((value) =>
      Math.max(priceLimit.min, Math.min(value, priceLimit.max)),
    )
    setPriceRange(minValue <= maxValue ? [minValue, maxValue] : [maxValue, minValue])
  }, [])

  const priceRangeLabel = `${formatSearchCurrency(priceRange[0], locale)} - ${formatSearchCurrency(
    priceRange[1],
    locale,
  )}`

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
