import type { Dispatch, ReactNode, Ref, SetStateAction } from 'react'
import type { Control } from 'react-hook-form'
import type { z } from 'zod'

import type { LocalizedHref } from '@shared/types/localized-href'
import type { useMarketplaceSearch } from '../hooks/use-marketplace-search'
import type { PropertyCardData } from '@shared/types'
import type { MapLocation } from './map-location'
import type { searchOptions } from '../config/search-filters'
import type {
  createMarketplaceSearchFormSchema,
  createSearchResultsFiltersFormSchema,
} from '../schemas/marketplace-search-schema'

export type SearchFilterKey = keyof typeof searchOptions

export type TextSearchFilterKey = Exclude<SearchFilterKey, 'priceRange'>

export type SearchResultPurpose = 'alugar' | 'comprar'

export type SearchResultPurposeParam = 'rent' | 'buy'

export type SearchResultProperty = PropertyCardData & {
  id: string
  purpose: SearchResultPurpose
  mapCenter?: {
    latitude: number
    longitude: number
  }
}

export type MarketplaceSearchFormValues = z.infer<
  ReturnType<typeof createMarketplaceSearchFormSchema>
>

export type SearchResultsFiltersFormValues = z.infer<
  ReturnType<typeof createSearchResultsFiltersFormSchema>
>

export type SearchResultsFilters = SearchResultsFiltersFormValues & {
  location: string
  city: string | null
  minPrice: number | null
}

export type SearchResultsState = SearchResultsFilters & {
  sortOption: SortOption
  page: number
  selectedPropertyId: string
}

export type SortOption = 'relevancia' | 'menor-preco' | 'maior-preco'

export type ViewMode = 'grid' | 'list'

export type SearchResultsViewModeScope = 'rent' | 'buy' | 'brokers' | 'agencies'

export type SearchResultsPageProps = {
  purpose: SearchResultPurpose
  initialCity?: string
  initialLocation?: string
  initialPropertyType?: SearchResultsFiltersFormValues['propertyType']
  initialPriceRange?: { min: number | null; max: number | null }
}

export type SearchResultsRoutePageProps = {
  searchParams?: {
    city?: string
    location?: string
    purpose?: string
    propertyType?: string
    priceRange?: string
  }
}

export type SearchResultsFiltersProps = {
  locationQuery: string
  setLocationQuery: (value: string) => void
}

export type SearchResultsLocationFieldProps = SearchResultsFiltersProps

export type SearchResultsFilterButtonProps = {
  filters: SearchResultsFiltersFormValues
  activeFiltersCount: number
  onApply: (filters: SearchResultsFiltersFormValues) => void
}

export type SearchResultsFilterDialogProps = {
  open: boolean
  filters: SearchResultsFiltersFormValues
  onClose: () => void
  onApply: (filters: SearchResultsFiltersFormValues) => void
}

export type SearchResultsFilterFieldsProps = {
  control: Control<SearchResultsFiltersFormValues>
}

export type SearchResultsMapProps = {
  locationUpdatedAt?: number
  viewerLocation?: MapLocation
  properties: SearchResultProperty[]
  selectedPropertyId: string
  onSelectProperty: (propertyId: string) => void
  searchQuery?: string
}

export type SearchResultsMapPanelProps = {
  locationUpdatedAt?: number
  viewerLocation?: MapLocation
  properties: SearchResultProperty[]
  selectedPropertyId: string
  setSelectedPropertyId: (propertyId: string) => void
  searchQuery?: string
}

export type SearchResultsListProps = {
  properties: SearchResultProperty[]
  isLoading?: boolean
  selectedPropertyId: string
  setSelectedPropertyId: (propertyId: string) => void
  viewMode: ViewMode
}

export type SearchResultsToolbarProps = {
  filtersControl?: ReactNode
  resultCount: number
  setSortOption: (option: SortOption) => void
  setViewMode: (mode: ViewMode) => void
  sortOption: SortOption
  viewMode: ViewMode
}

export type SearchResultsPaginationProps = {
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
}

export type SearchPropertyCardProps = {
  property: SearchResultProperty
  selected?: boolean
  onActivate?: () => void
  viewMode?: ViewMode
}

export type PriceRange = [number | null, number | null]

export type SearchDraft = Record<TextSearchFilterKey, string>

export type SelectedSearch = Record<TextSearchFilterKey, string>

export type SearchState = {
  selectedSearch: SelectedSearch
  searchDraft: SearchDraft
  priceRange: PriceRange
  purpose?: SearchResultPurposeParam
}

export type SearchPurposeToggleProps = {
  purpose: SearchResultPurposeParam
  onChange: (purpose: SearchResultPurposeParam) => void
  fullWidth?: boolean
}

export type SearchMenuProps = {
  selectedSearch: SelectedSearch
  searchDraft: SearchDraft
  filterSearchOptions: (key: TextSearchFilterKey) => readonly string[]
  getSearchOptionLabel: (key: TextSearchFilterKey, value: string) => string
  selectSearchValue: (key: TextSearchFilterKey, value: string) => void
  setSearchDraft: Dispatch<SetStateAction<SearchDraft>>
}

export type TextSearchMenuProps = SearchMenuProps & {
  filterKey: TextSearchFilterKey
  centered?: boolean
}

export type PriceRangeMenuProps = {
  priceRange: PriceRange
  updatePriceRange: (nextRange: PriceRange) => void
  closeSearchMenu: () => void
}

export type SearchFilterTriggerProps = {
  filterKey: SearchFilterKey
  value: string
  onOpen: (key: SearchFilterKey) => void
}

export type SearchDropdownFrameProps = {
  filterKey: SearchFilterKey
  children: ReactNode
}

export type DesktopSearchBarProps = SearchMenuProps &
  PriceRangeMenuProps & {
    priceRangeLabel: string
    purpose: SearchResultPurposeParam
    setPurpose: (purpose: SearchResultPurposeParam) => void
    activeSearchMenu: SearchFilterKey | null
    searchHref: LocalizedHref
    desktopSearchRef: Ref<HTMLDivElement>
    getSearchOptionLabel: (key: TextSearchFilterKey, value: string) => string
    openSearchMenu: (key: SearchFilterKey) => void
  }

export type MobileSearchBoxProps = Omit<DesktopSearchBarProps, 'desktopSearchRef'> & {
  mobileSearchRef: Ref<HTMLDivElement>
}

export type HeroSectionProps = DesktopSearchBarProps & {
  mobileSearchRef: Ref<HTMLDivElement>
}

export type HomeHeroAreaProps = { search: ReturnType<typeof useMarketplaceSearch> }
export type HomePropertySectionProps = { purpose?: SearchResultPurposeParam }
