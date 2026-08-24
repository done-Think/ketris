import type { HomeHeaderNavigationItem } from '@shared/types/home-header'

import type { FooterColumn } from './footer'

export type MarketplaceNavigationKey = 'home' | 'rent' | 'buy' | 'brokers' | 'agencies'

export type MarketplaceNavigationItem = HomeHeaderNavigationItem & {
  key: MarketplaceNavigationKey
}

export type MarketplaceNavigation = {
  homeNavigationItems: MarketplaceNavigationItem[]
  footerColumns: FooterColumn[]
  legalLinks: Array<{
    label: string
    href: string
  }>
}
