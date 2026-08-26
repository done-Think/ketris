import type { Dispatch, FormEventHandler, ReactNode, Ref, SetStateAction } from 'react'
import type { z } from 'zod'

import type { LocalizedHref } from '@shared/types/localized-href'
import type { searchOptions } from '../config/search-filters'
import type {
  marketplaceSearchFormSchema,
  searchResultsFiltersDialogFormSchema,
  searchResultsFormSchema,
} from '../schemas/marketplace-search-schema'
import type { MarketplacePropertyDetail } from './property-detail'

export type SearchFilterKey = keyof typeof searchOptions

export type TextSearchFilterKey = Exclude<SearchFilterKey, 'priceRange'>

export type SearchResultPurpose = 'alugar' | 'comprar'

export type SearchResultPurposeParam = 'rent' | 'buy'

export type SearchResultProperty = MarketplacePropertyDetail & {
  purpose: SearchResultPurpose
}

export type MarketplaceSearchFormValues = z.infer<typeof marketplaceSearchFormSchema>

export type SearchResultsFormValues = z.infer<typeof searchResultsFormSchema>

export type SearchResultsFiltersDialogFormValues = z.infer<
  typeof searchResultsFiltersDialogFormSchema
>

export type SortOption = 'relevancia' | 'menor-preco' | 'maior-preco'

export type ViewMode = 'grid' | 'list'

export type QuickFilterKey = 'type' | 'price' | 'bedrooms' | 'area' | 'more'

export type SearchResultsPageProps = {
  purpose: SearchResultPurpose
  initialLocation?: string
}

export type SearchResultsRoutePageProps = {
  searchParams?: {
    location?: string
    purpose?: string
  }
}

export type SearchResultsFiltersProps = {
  locationQuery: string
  setLocationQuery: (value: string) => void
}

export type SearchResultsFilterButtonProps = {
  areaFilterIndex: number
  bedroomFilterIndex: number
  customMaxPrice: string
  customMinArea: string
  maxPrice: number | null
  minArea: number | null
  onlyWithParking: boolean
  priceFilterIndex: number
  propertyTypeFilter: string
  setAreaFilterIndex: (index: number) => void
  setBedroomFilterIndex: (index: number) => void
  setCustomMaxPrice: (value: string) => void
  setCustomMinArea: (value: string) => void
  setOnlyWithParking: (value: boolean) => void
  setPriceFilterIndex: (index: number) => void
  setPropertyTypeFilter: (value: string) => void
}

export type SearchResultsFilterDialogProps = SearchResultsFiltersDialogFormValues & {
  clearDraftFilters: () => void
  closeFiltersDialog: () => void
  onSubmitFilters: FormEventHandler<HTMLFormElement>
  setAreaFilterIndex: (index: number) => void
  setBedroomFilterIndex: (index: number) => void
  setCustomMaxPrice: (value: string) => void
  setCustomMinArea: (value: string) => void
  setOnlyWithParking: (value: boolean) => void
  setPriceFilterIndex: (index: number) => void
  setPropertyTypeFilter: (value: string) => void
}

export type SearchResultsMapProps = {
  properties: SearchResultProperty[]
  selectedPropertyId: string
  onSelectProperty: (propertyId: string) => void
}

export type SearchResultsMapPanelProps = {
  properties: SearchResultProperty[]
  selectedPropertyId: string
  setSelectedPropertyId: (propertyId: string) => void
}

export type SearchResultsToolbarProps = {
  filtersControl?: ReactNode
  resultCount: number
  setSortOption: (option: SortOption) => void
  setViewMode: (mode: ViewMode) => void
  sortOption: SortOption
  viewMode: ViewMode
}

export type SearchPropertyCardProps = {
  property: SearchResultProperty
  selected?: boolean
  onActivate?: () => void
  viewMode?: ViewMode
}

export type PriceRange = [number, number]

export type SearchDraft = Record<TextSearchFilterKey, string>

export type SelectedSearch = Record<SearchFilterKey, string>

export type SearchState = {
  selectedSearch: SelectedSearch
  searchDraft: SearchDraft
  priceRange: PriceRange
}

export type SearchMenuProps = {
  selectedSearch: SelectedSearch
  searchDraft: SearchDraft
  filterSearchOptions: (key: TextSearchFilterKey) => readonly string[]
  selectSearchValue: (key: SearchFilterKey, value: string) => void
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
    activeSearchMenu: SearchFilterKey | null
    searchHref: LocalizedHref
    desktopSearchRef: Ref<HTMLDivElement>
    openSearchMenu: (key: SearchFilterKey) => void
  }

export type MobileSearchBoxProps = SearchMenuProps & {
  activeSearchMenu: SearchFilterKey | null
  mobileSearchRef: Ref<HTMLDivElement>
  searchHref: LocalizedHref
  openSearchMenu: (key: SearchFilterKey) => void
}

export type HeroSectionProps = DesktopSearchBarProps & {
  mobileSearchRef: Ref<HTMLDivElement>
}
