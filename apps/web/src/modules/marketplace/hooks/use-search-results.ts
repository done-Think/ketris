'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
} from '../config/search-results-filters'
import { searchResultsViewModeCookieKey } from '../config/search-results-view-mode'
import { searchResults } from '../data/search-results'
import type { SearchResultsPageProps, SortOption, ViewMode } from '../types/search'
import {
  formatCompactCurrency,
  getCurrencyValue,
  getFeatureNumber,
  normalizeLocationFilter,
} from '../utils/search-results'

const saveViewModePreference = (mode: ViewMode) => {
  document.cookie = [
    `${searchResultsViewModeCookieKey}=${encodeURIComponent(mode)}`,
    'path=/',
    'max-age=31536000',
    'samesite=lax',
  ].join('; ')
}

export function useSearchResults({
  initialLocation = '',
  initialViewMode = 'grid',
  purpose,
}: SearchResultsPageProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(searchResults[0]?.id ?? '')
  const [locationQuery, setLocationQuery] = useState(initialLocation)
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [priceFilterIndex, setPriceFilterIndex] = useState(0)
  const [customMaxPrice, setCustomMaxPrice] = useState('')
  const [bedroomFilterIndex, setBedroomFilterIndex] = useState(0)
  const [areaFilterIndex, setAreaFilterIndex] = useState(0)
  const [customMinArea, setCustomMinArea] = useState('')
  const [onlyWithParking, setOnlyWithParking] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('relevancia')
  const [viewMode, setViewModeState] = useState<ViewMode>(initialViewMode)

  const priceFilter = priceFilterOptions[priceFilterIndex]
  const bedroomFilter = bedroomFilterOptions[bedroomFilterIndex]
  const areaFilter = areaFilterOptions[areaFilterIndex]
  const customMaxPriceValue = Number(customMaxPrice)
  const customMinAreaValue = Number(customMinArea)
  const maxPrice = customMaxPriceValue > 0 ? customMaxPriceValue : priceFilter.max
  const minArea = customMinAreaValue > 0 ? customMinAreaValue : areaFilter.min
  const priceFilterLabel =
    customMaxPriceValue > 0
      ? `Até ${formatCompactCurrency(customMaxPriceValue)}`
      : priceFilter.label
  const areaFilterLabel = customMinAreaValue > 0 ? `${customMinAreaValue}m²+` : areaFilter.label

  const filteredResults = useMemo(() => {
    const nextResults = searchResults
      .filter((property) => property.purpose === purpose)
      .filter(
        (property) =>
          !locationQuery ||
          normalizeLocationFilter(property.location).includes(
            normalizeLocationFilter(locationQuery),
          ),
      )
      .filter((property) => !propertyTypeFilter || property.category === propertyTypeFilter)
      .filter((property) => !maxPrice || getCurrencyValue(property.price) <= maxPrice)
      .filter(
        (property) =>
          !bedroomFilter.min || getFeatureNumber(property, 'bedrooms') >= bedroomFilter.min,
      )
      .filter((property) => !minArea || getFeatureNumber(property, 'area') >= minArea)
      .filter((property) => !onlyWithParking || getFeatureNumber(property, 'parking') > 0)

    if (sortOption === 'menor-preco') {
      return [...nextResults].sort(
        (current, next) => getCurrencyValue(current.price) - getCurrencyValue(next.price),
      )
    }

    if (sortOption === 'maior-preco') {
      return [...nextResults].sort(
        (current, next) => getCurrencyValue(next.price) - getCurrencyValue(current.price),
      )
    }

    return nextResults
  }, [
    bedroomFilter.min,
    locationQuery,
    maxPrice,
    minArea,
    onlyWithParking,
    propertyTypeFilter,
    purpose,
    sortOption,
  ])

  useEffect(() => {
    if (filteredResults.some((property) => property.id === selectedPropertyId)) return

    setSelectedPropertyId(filteredResults[0]?.id ?? '')
  }, [filteredResults, selectedPropertyId])

  const clearPriceFilter = () => {
    setCustomMaxPrice('')
    setPriceFilterIndex(0)
  }

  const clearAreaFilter = () => {
    setCustomMinArea('')
    setAreaFilterIndex(0)
  }

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    saveViewModePreference(mode)
  }

  return {
    areaFilter,
    areaFilterIndex,
    areaFilterLabel,
    bedroomFilter,
    bedroomFilterIndex,
    clearAreaFilter,
    clearPriceFilter,
    customMaxPrice,
    customMinArea,
    filteredResults,
    locationQuery,
    maxPrice,
    minArea,
    onlyWithParking,
    priceFilterIndex,
    priceFilterLabel,
    propertyTypeFilter,
    selectedPropertyId,
    setAreaFilterIndex,
    setBedroomFilterIndex,
    setCustomMaxPrice,
    setCustomMinArea,
    setLocationQuery,
    setOnlyWithParking,
    setPriceFilterIndex,
    setPropertyTypeFilter,
    setSelectedPropertyId,
    setSortOption,
    setViewMode,
    sortOption,
    viewMode,
  }
}
