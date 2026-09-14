import type { FooterColumn } from './footer'
import type { SearchResultPurpose } from './search'
import type { LocalizedHref } from '@shared/types/localized-href'

export type MarketplaceNavigationItemId = 'home' | 'rent' | 'buy' | 'brokers' | 'agencies'

export type MarketplaceNavigationItem = {
  id: MarketplaceNavigationItemId
  label: string
  href: LocalizedHref
  active?: boolean
}

export type MarketplaceNavigation = {
  homeNavigationItems: MarketplaceNavigationItem[]
  footerColumns: FooterColumn[]
  legalLinks: Array<{
    label: string
    href: LocalizedHref
  }>
}

export type PropertyDetailNavigationParams = {
  activePurpose?: string
  originType?: string
  purpose?: string
}

export type MarketplaceNavigationHrefKey = MarketplaceNavigationItemId | 'properties' | 'login'

export type MarketplaceNavigationPurposeMap = Record<
  SearchResultPurpose,
  MarketplaceNavigationItemId
>
