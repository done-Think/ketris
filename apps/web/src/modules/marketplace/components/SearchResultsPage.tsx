'use client'

import { useRef, useState } from 'react'
import { Box } from '@mui/material'

import { HomeHeader, ProfileModal } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { homeNavigationItems } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import { useSearchResults } from '../hooks/use-search-results'
import type { SearchResultsPageProps } from '../types/search'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import {
  SearchResultsFilterButton,
  SearchResultsFilters,
} from './search-results/SearchResultsFilters'
import { SearchResultsList } from './search-results/SearchResultsList'
import { SearchResultsMapPanel } from './search-results/SearchResultsMapPanel'
import { SearchResultsPagination } from './search-results/SearchResultsPagination'
import { SearchResultsToolbar } from './search-results/SearchResultsToolbar'

export function SearchResultsPage({ initialLocation = '', purpose }: SearchResultsPageProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const results = useSearchResults({ purpose, initialLocation })
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href.includes(`finalidade=${purpose}`),
  }))
  const purposeLabel = purpose === 'comprar' ? 'Comprar' : 'Alugar'

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
          <MarketplaceBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: purposeLabel }]} />
          <SearchResultsFilters
            locationQuery={results.locationQuery}
            setLocationQuery={results.setLocationQuery}
          />
          <SearchResultsToolbar
            filtersControl={
              <SearchResultsFilterButton
                areaFilterIndex={results.areaFilterIndex}
                bedroomFilterIndex={results.bedroomFilterIndex}
                customMaxPrice={results.customMaxPrice}
                customMinArea={results.customMinArea}
                maxPrice={results.maxPrice}
                minArea={results.minArea}
                onlyWithParking={results.onlyWithParking}
                priceFilterIndex={results.priceFilterIndex}
                propertyTypeFilter={results.propertyTypeFilter}
                setAreaFilterIndex={results.setAreaFilterIndex}
                setBedroomFilterIndex={results.setBedroomFilterIndex}
                setCustomMaxPrice={results.setCustomMaxPrice}
                setCustomMinArea={results.setCustomMinArea}
                setOnlyWithParking={results.setOnlyWithParking}
                setPriceFilterIndex={results.setPriceFilterIndex}
                setPropertyTypeFilter={results.setPropertyTypeFilter}
              />
            }
            resultCount={results.filteredResults.length}
            setSortOption={results.setSortOption}
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
