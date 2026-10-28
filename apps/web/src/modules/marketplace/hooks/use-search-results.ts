'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import { useListState } from '@shared/hooks/use-list-state'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
  searchResultsPageSize,
} from '../config/search-results-filters'
import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { marketplaceService } from '../services/marketplace-service'
import type {
  PropertySortOption,
  PublicPropertyPurpose,
  SearchPropertiesFilters,
} from '../types/public-property'
import type {
  SearchResultsFiltersFormValues,
  SearchResultsPageProps,
  SearchResultsState,
  SearchResultsViewModeScope,
  SortOption,
} from '../types/search'
import { mapSummaryToSearchResult } from '../utils/property-summary-adapter'
import { useViewModePreference } from './use-view-mode-preference'

const viewModeScopeByPurpose: Record<
  SearchResultsPageProps['purpose'],
  SearchResultsViewModeScope
> = {
  alugar: 'rent',
  comprar: 'buy',
}

const apiPurposeByPurpose: Record<SearchResultsPageProps['purpose'], PublicPropertyPurpose> = {
  alugar: 'RENT',
  comprar: 'SALE',
}

const sortByOption: Record<SortOption, PropertySortOption | undefined> = {
  relevancia: undefined,
  'menor-preco': 'priceAsc',
  'maior-preco': 'priceDesc',
}

export const emptySearchResultsFilters: SearchResultsFiltersFormValues = {
  propertyType: null,
  priceOption: 0,
  customMaxPrice: '',
  bedroomOption: 0,
  areaOption: 0,
  customMinArea: '',
  onlyWithParking: false,
}

function positiveNumber(value: string): number | null {
  const parsed = Number(value)
  return value && parsed > 0 ? parsed : null
}

export function useSearchResults({
  purpose,
  initialLocation = '',
  initialPropertyType = null,
  initialPriceRange,
}: SearchResultsPageProps) {
  const locale = useLocale() as AppLocale
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const { viewMode, setViewMode } = useViewModePreference(viewModeScopeByPurpose[purpose])
  const {
    filters,
    setFilter,
    updateFilters: patchFilters,
  } = useListState<SearchResultsState>({
    ...emptySearchResultsFilters,
    propertyType: initialPropertyType,
    customMaxPrice: initialPriceRange?.max ? String(initialPriceRange.max) : '',
    location: initialLocation,
    minPrice: initialPriceRange?.min ?? null,
    sortOption: 'relevancia',
    page: 1,
    selectedPropertyId: '',
  })

  const customMaxPrice = positiveNumber(filters.customMaxPrice)
  const customMinArea = positiveNumber(filters.customMinArea)
  const maxPrice = customMaxPrice ?? priceFilterOptions[filters.priceOption].max
  const minArea = customMinArea ?? areaFilterOptions[filters.areaOption].min
  const minBedrooms = bedroomFilterOptions[filters.bedroomOption].min

  const query: SearchPropertiesFilters = {
    purpose: apiPurposeByPurpose[purpose],
    location: filters.location.trim() || undefined,
    propertyType: filters.propertyType ?? undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: maxPrice ?? undefined,
    minBedrooms: minBedrooms ?? undefined,
    minArea: minArea ?? undefined,
    hasParking: filters.onlyWithParking || undefined,
    sortBy: sortByOption[filters.sortOption],
    page: filters.page,
    pageSize: searchResultsPageSize,
  }

  const propertiesQuery = useQuery({
    queryKey: marketplaceQueryKeys.search(query),
    queryFn: () => marketplaceService.searchProperties(query),
    placeholderData: keepPreviousData,
  })

  const resultCount = propertiesQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(resultCount / searchResultsPageSize))
  const currentPage = Math.min(filters.page, totalPages)
  const results = (propertiesQuery.data?.properties ?? []).map((summary) =>
    mapSummaryToSearchResult(summary, purpose, locale, tFeatures),
  )
  const selectedPropertyId = results.some(({ id }) => id === filters.selectedPropertyId)
    ? filters.selectedPropertyId
    : (results[0]?.id ?? '')

  const applyFilters = (next: SearchResultsFiltersFormValues) => {
    const priceChanged =
      next.priceOption !== filters.priceOption || next.customMaxPrice !== filters.customMaxPrice
    patchFilters({ ...next, minPrice: priceChanged ? null : filters.minPrice, page: 1 })
  }

  const activeFiltersCount = [
    filters.propertyType,
    maxPrice ?? filters.minPrice,
    minBedrooms,
    minArea,
    filters.onlyWithParking,
  ].filter(Boolean).length

  return {
    activeFiltersCount,
    currentPage,
    filters,
    isError: propertiesQuery.isError,
    isLoading: propertiesQuery.isLoading,
    maxPrice,
    minArea,
    paginatedResults: results,
    refetch: propertiesQuery.refetch,
    resultCount,
    selectedPropertyId,
    setCurrentPage: (page: number) => setFilter('page', page),
    setLocationQuery: (location: string) => patchFilters({ location, page: 1 }),
    setSelectedPropertyId: (propertyId: string) => setFilter('selectedPropertyId', propertyId),
    setSortOption: (sortOption: SortOption) => patchFilters({ sortOption, page: 1 }),
    setViewMode,
    sortOption: filters.sortOption,
    totalPages,
    applyFilters,
    viewMode,
  }
}
