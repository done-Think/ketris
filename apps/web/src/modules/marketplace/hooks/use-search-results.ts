'use client'

import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
} from '../config/search-results-filters'
import { defaultSearchResultsViewMode } from '../config/search-results-view-mode'
import { marketplaceService } from '../services/marketplace-service'
import { searchResultsFormSchema } from '../schemas/marketplace-search-schema'
import type { PropertySortOption, PublicPropertyPurpose } from '../types/public-property'
import type {
  SearchResultsFormValues,
  SearchResultsPageProps,
  SortOption,
  ViewMode,
} from '../types/search'
import type { SearchResultsViewModeScope } from '../config/search-results-view-mode'
import { mapSummaryToSearchResult } from '../utils/property-summary-adapter'
import { formatCompactCurrency } from '../utils/search-results'
import { useViewModePreference } from './use-view-mode-preference'

const viewModeScopeByPurpose: Record<
  SearchResultsPageProps['purpose'],
  SearchResultsViewModeScope
> = {
  alugar: 'rent',
  comprar: 'buy',
}

const apiPurposeByPurpose: Record<SearchResultsPageProps['purpose'], PublicPropertyPurpose> = {
  alugar: 'ALUGUEL',
  comprar: 'VENDA',
}

const sortByOption: Record<SortOption, PropertySortOption | undefined> = {
  relevancia: undefined,
  'menor-preco': 'priceAsc',
  'maior-preco': 'priceDesc',
}

export function useSearchResults({ purpose, initialLocation = '' }: SearchResultsPageProps) {
  const { setValue, watch } = useForm<SearchResultsFormValues>({
    defaultValues: {
      selectedPropertyId: '',
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
  const persistedViewMode = useViewModePreference(viewModeScopeByPurpose[purpose])
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

  const searchFilters = {
    purpose: apiPurposeByPurpose[purpose],
    location: locationQuery || undefined,
    propertyType: propertyTypeFilter || undefined,
    maxPrice: maxPrice ?? undefined,
    minBedrooms: bedroomFilter.min ?? undefined,
    minArea: minArea ?? undefined,
    hasParking: onlyWithParking || undefined,
    sortBy: sortByOption[sortOption],
  }

  const propertiesQuery = useQuery({
    queryKey: ['marketplace', 'properties', 'search', searchFilters],
    queryFn: () => marketplaceService.searchProperties(searchFilters),
  })

  const filteredResults = useMemo(
    () => (propertiesQuery.data ?? []).map((summary) => mapSummaryToSearchResult(summary, purpose)),
    [propertiesQuery.data, purpose],
  )

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
    isError: propertiesQuery.isError,
    isLoading: propertiesQuery.isLoading,
    locationQuery,
    maxPrice,
    minArea,
    onlyWithParking,
    priceFilterIndex,
    priceFilterLabel,
    propertyTypeFilter,
    refetch: propertiesQuery.refetch,
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
