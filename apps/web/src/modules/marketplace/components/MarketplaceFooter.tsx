'use client'

import { SiteFooter } from '@shared/components/layout'

import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'

export function MarketplaceFooter() {
  const { footerColumns, legalLinks } = useMarketplaceNavigation()

  return <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
}
