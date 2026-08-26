export type MarketplaceNavigationItemId = 'home' | 'rent' | 'buy' | 'brokers' | 'agencies'

export type MarketplaceNavigationItem = {
  id: MarketplaceNavigationItemId
  label: string
  href: string
  active?: boolean
}

export type PropertyDetailNavigationParams = {
  activePurpose?: string
  originType?: string
  purpose?: string
}
