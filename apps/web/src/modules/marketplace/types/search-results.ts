import type { QuickFilterKey, SearchResultProperty, SortOption, ViewMode } from './search'

export type SearchResultsFilterMenuProps = {
  areaFilterIndex: number
  bedroomFilterIndex: number
  customMaxPrice: string
  customMinArea: string
  filterKey: QuickFilterKey
  onlyWithParking: boolean
  priceFilterIndex: number
  propertyTypeFilter: string
  setActiveQuickFilter: (filterKey: QuickFilterKey | null) => void
  setAreaFilterIndex: (index: number) => void
  setBedroomFilterIndex: (index: number) => void
  setCustomMaxPrice: (value: string) => void
  setCustomMinArea: (value: string) => void
  setOnlyWithParking: (value: boolean) => void
  setPriceFilterIndex: (index: number) => void
  setPropertyTypeFilter: (value: string) => void
}

export type SearchResultsLocationFieldProps = {
  locationQuery: string
  setLocationQuery: (value: string) => void
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
  customMaxPrice: string
  customMinArea: string
  locationQuery: string
  maxPrice: number | null
  minArea: number | null
  onlyWithParking: boolean
  priceFilterIndex: number
  priceFilterLabel: string
  propertyTypeFilter: string
  setAreaFilterIndex: (index: number) => void
  setBedroomFilterIndex: (index: number) => void
  setCustomMaxPrice: (value: string) => void
  setCustomMinArea: (value: string) => void
  setLocationQuery: (value: string) => void
  setOnlyWithParking: (value: boolean) => void
  setPriceFilterIndex: (index: number) => void
  setPropertyTypeFilter: (value: string) => void
}

export type SearchResultsMapPanelProps = {
  properties: SearchResultProperty[]
  selectedPropertyId: string
  setSelectedPropertyId: (propertyId: string) => void
}

export type SearchResultsToolbarProps = {
  resultCount: number
  setSortOption: (option: SortOption) => void
  setViewMode: (mode: ViewMode) => void
  sortOption: SortOption
  viewMode: ViewMode
}
