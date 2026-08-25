'use client'

import { useMemo, useRef } from 'react'
import { Box } from '@mui/material'

import { SiteFooter } from '@shared/components/layout'
import { useClickAway } from '@shared/hooks'
import { surface } from '@shared/theme/tokens'

import { footerColumns, legalLinks } from '../config/navigation'
import { useMarketplaceSearch } from '../hooks/use-marketplace-search'
import { FeaturedPropertiesSection } from './FeaturedPropertiesSection'
import { HeroSection } from './HeroSection'
import { MarketplaceHeader } from './MarketplaceHeader'
import { MiniPropertiesSection } from './MiniPropertiesSection'

export function HomePageClient() {
  const search = useMarketplaceSearch()
  const { activeSearchMenu, closeSearchMenu } = search
  const desktopSearchRef = useRef<HTMLDivElement | null>(null)
  const mobileSearchRef = useRef<HTMLDivElement | null>(null)
  const searchRefs = useMemo(() => [desktopSearchRef, mobileSearchRef], [])

  useClickAway(searchRefs, closeSearchMenu, { enabled: Boolean(activeSearchMenu) })

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        overflowX: 'clip',
        bgcolor: surface.app,
      }}
    >
      <MarketplaceHeader activeItemId="home" />

      <HeroSection
        selectedSearch={search.selectedSearch}
        priceRange={search.priceRange}
        priceRangeLabel={search.priceRangeLabel}
        activeSearchMenu={search.activeSearchMenu}
        searchDraft={search.searchDraft}
        searchHref={search.searchHref}
        desktopSearchRef={desktopSearchRef}
        mobileSearchRef={mobileSearchRef}
        openSearchMenu={search.openSearchMenu}
        closeSearchMenu={search.closeSearchMenu}
        selectSearchValue={search.selectSearchValue}
        updatePriceRange={search.updatePriceRange}
        filterSearchOptions={search.filterSearchOptions}
        setSearchDraft={search.setSearchDraft}
      />

      <FeaturedPropertiesSection />

      <MiniPropertiesSection />

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
