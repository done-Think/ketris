export type OwnerPropertyStatus = 'active' | 'paused'

export type OwnerPropertyPurpose = 'rent' | 'sale'

export type OwnerPropertyStatusFilter = 'all' | 'without-proposals' | OwnerPropertyStatus

export type OwnerPropertyPurposeFilter = 'all' | OwnerPropertyPurpose

export type OwnerPropertyFilters = {
  searchQuery: string
  status: OwnerPropertyStatusFilter
  purpose: OwnerPropertyPurposeFilter
}

export type OwnerProperty = {
  id: string
  code: string
  title: string
  address: string
  price: string
  status: OwnerPropertyStatus
  badgeStatus: OwnerPropertyStatus
  purpose: OwnerPropertyPurpose
  views: number
  favorites: number
  proposals: number
  publishedDaysAgo: number
}

export type OwnerPropertiesSummary = {
  totalProperties: number
  activeProperties: number
  pausedProperties: number
  totalViews: number
  openProposals: number
}

export type OwnerPropertiesHeaderProps = {
  filters: OwnerPropertyFilters
  onFiltersChange: (filters: OwnerPropertyFilters) => void
}

export type OwnerPropertyCardProps = {
  property: OwnerProperty
}
