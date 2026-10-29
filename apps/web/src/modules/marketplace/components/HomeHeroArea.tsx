'use client'

import { useMemo, useRef } from 'react'

import { useClickAway } from '@shared/hooks'

import { useMarketplaceSearch } from '../hooks/use-marketplace-search'
import { useMarketplaceStats } from '../hooks/use-marketplace-stats'
import { HeroSection } from './HeroSection'
import { MarketplaceHeader } from './MarketplaceHeader'

export function HomeHeroArea() {
  const { data: stats } = useMarketplaceStats()
  const search = useMarketplaceSearch(stats?.locations)
  const { activeSearchMenu, closeSearchMenu } = search
  const desktopSearchRef = useRef<HTMLDivElement | null>(null)
  const mobileSearchRef = useRef<HTMLDivElement | null>(null)
  const searchRefs = useMemo(() => [desktopSearchRef, mobileSearchRef], [])

  useClickAway(searchRefs, closeSearchMenu, { enabled: Boolean(activeSearchMenu) })

  return (
    <>
      <MarketplaceHeader activeItemId="home" />
      <HeroSection
        selectedSearch={search.selectedSearch}
        priceRange={search.priceRange}
        priceRangeLabel={search.priceRangeLabel}
        activeSearchMenu={search.activeSearchMenu}
        searchDraft={search.searchDraft}
        searchHref={search.searchHref}
        purpose={search.purpose}
        setPurpose={search.setPurpose}
        desktopSearchRef={desktopSearchRef}
        mobileSearchRef={mobileSearchRef}
        openSearchMenu={search.openSearchMenu}
        closeSearchMenu={search.closeSearchMenu}
        selectSearchValue={search.selectSearchValue}
        updatePriceRange={search.updatePriceRange}
        filterSearchOptions={search.filterSearchOptions}
        getSearchOptionLabel={search.getSearchOptionLabel}
        setSearchDraft={search.setSearchDraft}
      />
    </>
  )
}
