'use client'

import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
} from '../config/search-results-filters'
import { defaultSearchResultsViewMode } from '../config/search-results-view-mode'
import { searchResults } from '../data/search-results'
import { searchResultsFormSchema } from '../schemas/marketplace-search-schema'
import type {
  SearchResultsFormValues,
  SearchResultsPageProps,
  SortOption,
  ViewMode,
} from '../types/search'
import {
  formatCompactCurrency,
  getCurrencyValue,
  getFeatureNumber,
  normalizeLocationFilter,
} from '../utils/search-results'
import { useViewModePreference } from './use-view-mode-preference'

export function useSearchResults({ purpose, initialLocation = '' }: SearchResultsPageProps) {
  const { setValue, watch } = useForm<SearchResultsFormValues>({
    defaultValues: {
      selectedPropertyId: searchResults[0]?.id ?? '',
      locationQuery: initialLocation,
      propertyTypeFilter: '',
      priceFilterIndex: 0,
      customMaxPrice: '',
      bedroomFilterIndex: 0,
      areaFilterIndex: 0,
      customMinArea: '',
      onlyWithParking: false,
      sortOption: 'relevancia',
      viewMode: defaultSearchResultsViewMode,
    },
    resolver: zodResolver(searchResultsFormSchema),
  })
  const persistedViewMode = useViewModePreference(purpose)
  const {
    areaFilterIndex,
    bedroomFilterIndex,
    customMaxPrice,
    customMinArea,
    locationQuery,
    onlyWithParking,
    priceFilterIndex,
    propertyTypeFilter,
    selectedPropertyId,
    sortOption,
    viewMode,
  } = watch()

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

    setValue('selectedPropertyId', filteredResults[0]?.id ?? '')
  }, [filteredResults, selectedPropertyId, setValue])

  useEffect(() => {
    if (persistedViewMode.viewMode === viewMode) return

    setValue('viewMode', persistedViewMode.viewMode)
  }, [persistedViewMode.viewMode, setValue, viewMode])

  const clearPriceFilter = () => {
    setValue('customMaxPrice', '')
    setValue('priceFilterIndex', 0)
  }

  const clearAreaFilter = () => {
    setValue('customMinArea', '')
    setValue('areaFilterIndex', 0)
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
    setAreaFilterIndex: (index: number) => setValue('areaFilterIndex', index),
    setBedroomFilterIndex: (index: number) => setValue('bedroomFilterIndex', index),
    setCustomMaxPrice: (value: string) => setValue('customMaxPrice', value),
    setCustomMinArea: (value: string) => setValue('customMinArea', value),
    setLocationQuery: (value: string) => setValue('locationQuery', value),
    setOnlyWithParking: (value: boolean) => setValue('onlyWithParking', value),
    setPriceFilterIndex: (index: number) => setValue('priceFilterIndex', index),
    setPropertyTypeFilter: (value: string) => setValue('propertyTypeFilter', value),
    setSelectedPropertyId: (propertyId: string) => setValue('selectedPropertyId', propertyId),
    setSortOption: (option: SortOption) => setValue('sortOption', option),
    setViewMode: (mode: ViewMode) => {
      persistedViewMode.setViewMode(mode)
      setValue('viewMode', mode)
    },
    sortOption,
    viewMode,
  }
}
