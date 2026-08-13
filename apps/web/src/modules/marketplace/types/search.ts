import type { Dispatch, ReactNode, Ref, SetStateAction } from 'react'

import type { PropertyCardData } from '@shared/types'

import type { searchOptions } from '../config/search-filters'
import type { MarketplacePropertyDetail } from './property-detail'

export type SearchFilterKey = keyof typeof searchOptions

export type TextSearchFilterKey = Exclude<SearchFilterKey, 'priceRange'>

export type SearchResultPurpose = 'alugar' | 'comprar'

export type SearchResultProperty = MarketplacePropertyDetail & {
  purpose: SearchResultPurpose
}

export type SortOption = 'relevancia' | 'menor-preco' | 'maior-preco'

export type ViewMode = 'grid' | 'list'

export type QuickFilterKey = 'type' | 'price' | 'bedrooms' | 'area' | 'more'

export type SearchResultsPageProps = {
  purpose: SearchResultPurpose
  initialLocation?: string
}

export type SearchResultsMapProps = {
  properties: MarketplacePropertyDetail[]
  selectedPropertyId: string
  onSelectProperty: (propertyId: string) => void
}

export type SearchPropertyCardProps = {
  property: PropertyCardData
  selected?: boolean
  onActivate?: () => void
}

export type PriceRange = [number, number]

export type SearchDraft = Record<TextSearchFilterKey, string>

export type SelectedSearch = Record<SearchFilterKey, string>

export type SearchState = {
  selectedSearch: SelectedSearch
  searchDraft: SearchDraft
  priceRange: PriceRange
}

export type MarketplaceSearchFormValues = {
  activeSearchMenu: SearchFilterKey | null
  selectedSearch: SelectedSearch
  priceRange: PriceRange
  searchDraft: SearchDraft
}

export type SearchResultsFormValues = {
  selectedPropertyId: string
  locationQuery: string
  propertyTypeFilter: string
  priceFilterIndex: number
  customMaxPrice: string
  bedroomFilterIndex: number
  areaFilterIndex: number
  customMinArea: string
  onlyWithParking: boolean
  sortOption: SortOption
  viewMode: ViewMode
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
    searchHref: string
    desktopSearchRef: Ref<HTMLDivElement>
    openSearchMenu: (key: SearchFilterKey) => void
  }

export type MobileSearchBoxProps = SearchMenuProps & {
  activeSearchMenu: SearchFilterKey | null
  mobileSearchRef: Ref<HTMLDivElement>
  searchHref: string
  openSearchMenu: (key: SearchFilterKey) => void
}

export type HeroSectionProps = DesktopSearchBarProps & {
  mobileSearchRef: Ref<HTMLDivElement>
}
