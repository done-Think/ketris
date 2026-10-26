'use client'

import { useMemo, useRef } from 'react'

import { useClickAway } from '@shared/hooks'

import { useMarketplaceSearch } from '../hooks/use-marketplace-search'
import { HeroSection } from './HeroSection'

// The only interactive part of the home above the fold: the search box and its menus.
export function HomeHero() {
  const search = useMarketplaceSearch()
  const { activeSearchMenu, closeSearchMenu } = search
  const desktopSearchRef = useRef<HTMLDivElement | null>(null)
  const mobileSearchRef = useRef<HTMLDivElement | null>(null)
  const searchRefs = useMemo(() => [desktopSearchRef, mobileSearchRef], [])

  useClickAway(searchRefs, closeSearchMenu, { enabled: Boolean(activeSearchMenu) })

  return (
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
      getSearchOptionLabel={search.getSearchOptionLabel}
      setSearchDraft={search.setSearchDraft}
    />
  )
}
