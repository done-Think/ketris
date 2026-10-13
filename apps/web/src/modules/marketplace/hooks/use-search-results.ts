'use client'

import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
} from '../config/search-results-filters'
import { defaultSearchResultsViewMode } from '../config/search-results-view-mode'
import { propertyDetails } from '../data/property-details'
import { marketplaceService } from '../services/marketplace-service'
import { createSearchResultsFormSchema } from '../schemas/marketplace-search-schema'
import type { PropertySortOption, PublicPropertyPurpose } from '../types/public-property'
import type {
  SearchResultProperty,
  SearchResultsFormValues,
  SearchResultsPageProps,
  SearchResultsViewModeScope,
  SortOption,
  ViewMode,
} from '../types/search'
import { mapSummaryToSearchResult } from '../utils/property-summary-adapter'
import { formatPropertyArea, type PropertyText } from '../utils/property-presentation'
import {
  formatCompactCurrency,
  getCurrencyValue,
  getFeatureNumber,
  normalizeLocationFilter,
} from '../utils/search-results'
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

function getFixturePurpose(property: (typeof propertyDetails)[number]) {
  return property.price.includes('/') ? 'alugar' : 'comprar'
}

function mapFixtureToSearchResult(
  property: (typeof propertyDetails)[number],
  purpose: SearchResultsPageProps['purpose'],
): SearchResultProperty & { category: string } {
  return {
    ...property,
    purpose,
  }
}

function localizeFixtureSearchResult(
  property: SearchResultProperty,
  locale: AppLocale,
  t: PropertyText,
): SearchResultProperty {
  const price = formatCompactCurrency(getCurrencyValue(property.price), locale)

  return {
    ...property,
    price: property.purpose === 'alugar' ? t('monthly', { price }) : price,
    details: property.details.map((detail) => {
      if (detail.key === 'area') {
        return { ...detail, label: formatPropertyArea(getFeatureNumber(property, 'area'), locale) }
      }
      if (detail.key === 'bedrooms' || detail.key === 'bathrooms' || detail.key === 'parking') {
        return {
          ...detail,
          label: t(detail.key, { count: getFeatureNumber(property, detail.key) }),
        }
      }
      return detail
    }),
  }
}

function matchesFixtureFilters(
  property: SearchResultProperty & { category?: string },
  filters: {
    locationQuery: string
    propertyTypeFilter: string
    maxPrice: number | null
    bedroomMin: number | null
    minArea: number | null
    onlyWithParking: boolean
  },
) {
  const normalizedLocation = normalizeLocationFilter(filters.locationQuery)
  const normalizedPropertyLocation = normalizeLocationFilter(
    [property.title, property.location].join(' '),
  )
  const normalizedType = normalizeLocationFilter(property.category ?? '')

  if (normalizedLocation && !normalizedPropertyLocation.includes(normalizedLocation)) return false
  if (
    filters.propertyTypeFilter &&
    normalizedType !== normalizeLocationFilter(filters.propertyTypeFilter)
  )
    return false
  if (filters.maxPrice && getCurrencyValue(property.price) > filters.maxPrice) return false
  if (filters.bedroomMin && getFeatureNumber(property, 'bedrooms') < filters.bedroomMin)
    return false
  if (filters.minArea && getFeatureNumber(property, 'area') < filters.minArea) return false
  if (filters.onlyWithParking && getFeatureNumber(property, 'parking') < 1) return false

  return true
}

function sortFixtureResults(properties: SearchResultProperty[], sortOption: SortOption) {
  if (sortOption === 'menor-preco') {
    return [...properties].sort((a, b) => getCurrencyValue(a.price) - getCurrencyValue(b.price))
  }

  if (sortOption === 'maior-preco') {
    return [...properties].sort((a, b) => getCurrencyValue(b.price) - getCurrencyValue(a.price))
  }

  return properties
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
      viewMode: defaultSearchResultsViewMode,
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
    selectedPropertyId,
    sortOption,
    viewMode,
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
  }

  const propertiesQuery = useQuery({
    queryKey: ['marketplace', 'properties', 'search', searchFilters],
    queryFn: () => marketplaceService.searchProperties(searchFilters),
  })
  const canUseFixtures = process.env.NODE_ENV !== 'production'
  const fixtureMode =
    canUseFixtures &&
    !propertiesQuery.isLoading &&
    (propertiesQuery.isError || (propertiesQuery.data ?? []).length === 0)

  const fixtureResults = useMemo(() => {
    const matchedResults = propertyDetails
      .filter((property) => getFixturePurpose(property) === purpose)
      .map((property) => mapFixtureToSearchResult(property, purpose))
      .filter((property) =>
        matchesFixtureFilters(property, {
          locationQuery,
          propertyTypeFilter,
          maxPrice,
          bedroomMin: bedroomFilter.min,
          minArea,
          onlyWithParking,
        }),
      )

    return sortFixtureResults(matchedResults, sortOption)
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

  const filteredResults = useMemo(() => {
    if (fixtureMode) {
      return fixtureResults.map((property) =>
        localizeFixtureSearchResult(property, locale, tFeatures),
      )
    }

    return (propertiesQuery.data ?? []).map((summary) =>
      mapSummaryToSearchResult(summary, purpose, locale, tFeatures),
    )
  }, [fixtureMode, fixtureResults, propertiesQuery.data, purpose, locale, tFeatures])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / searchResultsPageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedResults = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * searchResultsPageSize

    return filteredResults.slice(startIndex, startIndex + searchResultsPageSize)
  }, [filteredResults, safeCurrentPage])

  useEffect(() => {
    if (currentPage === safeCurrentPage) return

    setValue('currentPage', safeCurrentPage)
  }, [currentPage, safeCurrentPage, setValue])

  useEffect(() => {
    if (paginatedResults.some((property) => property.id === selectedPropertyId)) return

    setValue('selectedPropertyId', paginatedResults[0]?.id ?? '')
  }, [paginatedResults, selectedPropertyId, setValue])

  useEffect(() => {
    if (persistedViewMode.viewMode === viewMode) return

    setValue('viewMode', persistedViewMode.viewMode)
  }, [persistedViewMode.viewMode, setValue, viewMode])

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
    filteredResults,
    currentPage: safeCurrentPage,
    isError: propertiesQuery.isError && !fixtureMode,
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
    setViewMode: (mode: ViewMode) => {
      persistedViewMode.setViewMode(mode)
      setValue('viewMode', mode)
    },
    sortOption,
    totalPages,
    viewMode,
  }
}
