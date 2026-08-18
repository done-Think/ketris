'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
} from '../config/search-results-filters'
import { searchResults } from '../data/search-results'
import {
  parseNumericFilter,
  searchFiltersSchema,
  type SearchFiltersFormValues,
} from '../schemas/search-filters-schema'
import type { SearchResultsPageProps, ViewMode } from '../types/search'
import {
  formatCompactCurrency,
  getCurrencyValue,
  getFeatureNumber,
  normalizeLocationFilter,
} from '../utils/search-results'

export function useSearchResults({ purpose, initialLocation = '' }: SearchResultsPageProps) {
  const { control, setValue } = useForm<SearchFiltersFormValues>({
    resolver: zodResolver(searchFiltersSchema),
    mode: 'onChange',
    defaultValues: {
      locationQuery: initialLocation,
      propertyTypeFilter: '',
      priceFilterIndex: 0,
      customMaxPrice: '',
      bedroomFilterIndex: 0,
      areaFilterIndex: 0,
      customMinArea: '',
      onlyWithParking: false,
      sortOption: 'relevancia',
    },
  })

  const {
    areaFilterIndex,
    bedroomFilterIndex,
    customMaxPrice,
    customMinArea,
    locationQuery,
    onlyWithParking,
    priceFilterIndex,
    propertyTypeFilter,
    sortOption,
  } = useWatch({ control })

  const [selectedPropertyId, setSelectedPropertyId] = useState(searchResults[0]?.id ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const priceFilter = priceFilterOptions[priceFilterIndex ?? 0]
  const bedroomFilter = bedroomFilterOptions[bedroomFilterIndex ?? 0]
  const areaFilter = areaFilterOptions[areaFilterIndex ?? 0]
  const customMaxPriceValue = parseNumericFilter(customMaxPrice ?? '')
  const customMinAreaValue = parseNumericFilter(customMinArea ?? '')
  const maxPrice = customMaxPriceValue ?? priceFilter.max
  const minArea = customMinAreaValue ?? areaFilter.min
  const priceFilterLabel = customMaxPriceValue
    ? `Até ${formatCompactCurrency(customMaxPriceValue)}`
    : priceFilter.label
  const areaFilterLabel = customMinAreaValue ? `${customMinAreaValue}m²+` : areaFilter.label

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
    setValue('customMaxPrice', '')
    setValue('priceFilterIndex', 0)
  }

  const clearAreaFilter = () => {
    setValue('customMinArea', '')
    setValue('areaFilterIndex', 0)
  }

  return {
    areaFilter,
    areaFilterIndex: areaFilterIndex ?? 0,
    areaFilterLabel,
    bedroomFilter,
    bedroomFilterIndex: bedroomFilterIndex ?? 0,
    clearAreaFilter,
    clearPriceFilter,
    control,
    filteredResults,
    locationQuery: locationQuery ?? '',
    maxPrice,
    minArea,
    onlyWithParking: onlyWithParking ?? false,
    priceFilterIndex: priceFilterIndex ?? 0,
    priceFilterLabel,
    propertyTypeFilter: propertyTypeFilter ?? '',
    selectedPropertyId,
    setFilterValue: setValue,
    setSelectedPropertyId,
    setViewMode,
    sortOption: sortOption ?? 'relevancia',
    viewMode,
  }
}
