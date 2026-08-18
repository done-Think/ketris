'use client'

import { useRef, useState } from 'react'
import { Box } from '@mui/material'

import { HomeHeader, ProfileModal } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { homeNavigationItems } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import { useSearchResults } from '../hooks/use-search-results'
import type { SearchResultsPageProps } from '../types/search'
import { SearchResultsFilters } from './search-results/SearchResultsFilters'
import { SearchResultsList } from './search-results/SearchResultsList'
import { SearchResultsMapPanel } from './search-results/SearchResultsMapPanel'
import { SearchResultsPagination } from './search-results/SearchResultsPagination'
import { SearchResultsToolbar } from './search-results/SearchResultsToolbar'

export function SearchResultsPage({ purpose, initialLocation = '' }: SearchResultsPageProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const results = useSearchResults({ purpose, initialLocation })
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href.includes(`finalidade=${purpose}`),
  }))

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
        navigationItems={navigationItems}
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

      <Box
        component="main"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.08fr) minmax(430px, 0.92fr)' },
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3, xl: 5 },
            py: { xs: 2, md: 3 },
            minWidth: 0,
          }}
        >
          <SearchResultsFilters
            areaFilterIndex={results.areaFilterIndex}
            areaFilterLabel={results.areaFilterLabel}
            bedroomFilterIndex={results.bedroomFilterIndex}
            bedroomFilterLabel={results.bedroomFilter.label}
            clearAreaFilter={results.clearAreaFilter}
            clearPriceFilter={results.clearPriceFilter}
            control={results.control}
            locationQuery={results.locationQuery}
            maxPrice={results.maxPrice}
            minArea={results.minArea}
            onlyWithParking={results.onlyWithParking}
            priceFilterIndex={results.priceFilterIndex}
            priceFilterLabel={results.priceFilterLabel}
            propertyTypeFilter={results.propertyTypeFilter}
            setFilterValue={results.setFilterValue}
          />
          <SearchResultsToolbar
            resultCount={results.filteredResults.length}
            setFilterValue={results.setFilterValue}
            setViewMode={results.setViewMode}
            sortOption={results.sortOption}
            viewMode={results.viewMode}
          />
          <SearchResultsList
            properties={results.filteredResults}
            selectedPropertyId={results.selectedPropertyId}
            setSelectedPropertyId={results.setSelectedPropertyId}
            viewMode={results.viewMode}
          />
          <SearchResultsPagination />
        </Box>

        <SearchResultsMapPanel
          properties={results.filteredResults}
          selectedPropertyId={results.selectedPropertyId}
          setSelectedPropertyId={results.setSelectedPropertyId}
        />
      </Box>
    </Box>
  )
}
