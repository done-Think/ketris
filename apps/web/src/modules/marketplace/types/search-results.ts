import type { Control, UseFormSetValue } from 'react-hook-form'

import type { SearchFiltersFormValues } from '../schemas/search-filters-schema'
import type { QuickFilterKey, SearchResultProperty, SortOption, ViewMode } from './search'

export type SearchResultsFilterMenuProps = {
  areaFilterIndex: number
  bedroomFilterIndex: number
  control: Control<SearchFiltersFormValues>
  filterKey: QuickFilterKey
  onlyWithParking: boolean
  priceFilterIndex: number
  propertyTypeFilter: string
  setActiveQuickFilter: (filterKey: QuickFilterKey | null) => void
  setFilterValue: UseFormSetValue<SearchFiltersFormValues>
}

export type SearchResultsLocationFieldProps = {
  locationQuery: string
  setFilterValue: UseFormSetValue<SearchFiltersFormValues>
}

export type SearchResultsListProps = {
  properties: SearchResultProperty[]
  selectedPropertyId: string
  setSelectedPropertyId: (propertyId: string) => void
  viewMode: ViewMode
}

export type SearchResultsFiltersProps = {
  areaFilterIndex: number
  areaFilterLabel: string
  bedroomFilterIndex: number
  bedroomFilterLabel: string
  clearAreaFilter: () => void
  clearPriceFilter: () => void
  control: Control<SearchFiltersFormValues>
  locationQuery: string
  maxPrice: number | null
  minArea: number | null
  onlyWithParking: boolean
  priceFilterIndex: number
  priceFilterLabel: string
  propertyTypeFilter: string
  setFilterValue: UseFormSetValue<SearchFiltersFormValues>
}

export type SearchResultsMapPanelProps = {
  properties: SearchResultProperty[]
  selectedPropertyId: string
  setSelectedPropertyId: (propertyId: string) => void
}

export type SearchResultsToolbarProps = {
  resultCount: number
  setFilterValue: UseFormSetValue<SearchFiltersFormValues>
  setViewMode: (mode: ViewMode) => void
  sortOption: SortOption
  viewMode: ViewMode
}
