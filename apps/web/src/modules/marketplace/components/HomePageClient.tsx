'use client'

import { useMemo, useRef, useState } from 'react'
import { Box } from '@mui/material'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { useClickAway } from '@shared/hooks'
import { surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import { useMarketplaceSearch } from '../hooks/use-marketplace-search'
import { FeaturedPropertiesSection } from './FeaturedPropertiesSection'
import { HeroSection } from './HeroSection'
import { MiniPropertiesSection } from './MiniPropertiesSection'

export function HomePageClient() {
  const search = useMarketplaceSearch()
  const { activeSearchMenu, closeSearchMenu } = search
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
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
      <HomeHeader
        navigationItems={homeNavigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={userProfile}
        onToggleProfile={() => setIsProfileOpen((current) => !current)}
      />

      <ProfileModal
        open={isProfileOpen}
        anchorRef={profileButtonRef}
        actions={profileActions}
        userProfile={userProfile}
        onClose={() => setIsProfileOpen(false)}
      />

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
