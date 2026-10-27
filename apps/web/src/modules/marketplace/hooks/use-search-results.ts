'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
} from '../config/search-results-filters'
import { publicPropertyQueryKeys } from '../config/property-query-keys'
import { marketplaceService } from '../services/marketplace-service'
import { createSearchResultsFormSchema } from '../schemas/marketplace-search-schema'
import type { PropertySortOption, PublicPropertyPurpose } from '../types/public-property'
import type {
  SearchResultsFormValues,
  SearchResultsPageProps,
  SearchResultsViewModeScope,
  SortOption,
  ViewMode,
} from '../types/search'
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

const searchResultsPageSize = 10

const sortByOption: Record<SortOption, PropertySortOption | undefined> = {
  relevancia: undefined,
  'menor-preco': 'priceAsc',
  'maior-preco': 'priceDesc',
}

export function useSearchResults({ purpose, initialLocation = '' }: SearchResultsPageProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace.searchResults.errors')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const tPrice = useTranslations('marketplace.searchResults.filters')
  const searchResultsFormSchema = useMemo(() => createSearchResultsFormSchema((key) => t(key)), [t])
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
      currentPage: 1,
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
    selectedPropertyId: selectedId,
    sortOption,
    currentPage,
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
      ? tPrice('upToPrice', { price: formatCompactCurrency(customMaxPriceValue, locale) })
      : priceFilter.label
  const areaFilterLabel =
    customMinAreaValue > 0
      ? `${new Intl.NumberFormat(locale).format(customMinAreaValue)} m²+`
      : areaFilter.label

  const searchFilters = {
    purpose: apiPurposeByPurpose[purpose],
    location: locationQuery || undefined,
    propertyType: propertyTypeFilter || undefined,
    maxPrice: maxPrice ?? undefined,
    minBedrooms: bedroomFilter.min ?? undefined,
    minArea: minArea ?? undefined,
    hasParking: onlyWithParking || undefined,
    sortBy: sortByOption[sortOption],
    page: currentPage,
    pageSize: searchResultsPageSize,
  }

  const propertiesQuery = useQuery({
    queryKey: publicPropertyQueryKeys.search(searchFilters),
    queryFn: () => marketplaceService.searchProperties(searchFilters),
    placeholderData: keepPreviousData,
  })
  const resultCount = propertiesQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(resultCount / searchResultsPageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedResults = useMemo(
    () =>
      (propertiesQuery.data?.properties ?? []).map((summary) =>
        mapSummaryToSearchResult(summary, purpose, locale, tFeatures),
      ),
    [locale, propertiesQuery.data, purpose, tFeatures],
  )
  // A selection outside the current page falls back to the first property shown.
  const selectedPropertyId = paginatedResults.some((property) => property.id === selectedId)
    ? selectedId
    : (paginatedResults[0]?.id ?? '')

  const clearPriceFilter = () => {
    setValue('customMaxPrice', '')
    setValue('priceFilterIndex', 0)
    setValue('currentPage', 1)
  }

  const clearAreaFilter = () => {
    setValue('customMinArea', '')
    setValue('areaFilterIndex', 0)
    setValue('currentPage', 1)
  }

  const resetCurrentPage = () => setValue('currentPage', 1)

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
    resultCount,
    currentPage: safeCurrentPage,
    isError: propertiesQuery.isError,
    isLoading: propertiesQuery.isLoading,
    locationQuery,
    maxPrice,
    minArea,
    onlyWithParking,
    priceFilterIndex,
    priceFilterLabel,
    propertyTypeFilter,
    paginatedResults,
    refetch: propertiesQuery.refetch,
    selectedPropertyId,
    setAreaFilterIndex: (index: number) => {
      setValue('areaFilterIndex', index)
      resetCurrentPage()
    },
    setBedroomFilterIndex: (index: number) => {
      setValue('bedroomFilterIndex', index)
      resetCurrentPage()
    },
    setCustomMaxPrice: (value: string) => {
      setValue('customMaxPrice', value)
      resetCurrentPage()
    },
    setCustomMinArea: (value: string) => {
      setValue('customMinArea', value)
      resetCurrentPage()
    },
    setLocationQuery: (value: string) => {
      setValue('locationQuery', value)
      resetCurrentPage()
    },
    setOnlyWithParking: (value: boolean) => {
      setValue('onlyWithParking', value)
      resetCurrentPage()
    },
    setPriceFilterIndex: (index: number) => {
      setValue('priceFilterIndex', index)
      resetCurrentPage()
    },
    setPropertyTypeFilter: (value: string) => {
      setValue('propertyTypeFilter', value)
      resetCurrentPage()
    },
    setCurrentPage: (page: number) => setValue('currentPage', page),
    setSelectedPropertyId: (propertyId: string) => setValue('selectedPropertyId', propertyId),
    setSortOption: (option: SortOption) => {
      setValue('sortOption', option)
      resetCurrentPage()
    },
    setViewMode: (mode: ViewMode) => persistedViewMode.setViewMode(mode),
    sortOption,
    totalPages,
    viewMode: persistedViewMode.viewMode,
  }
}
