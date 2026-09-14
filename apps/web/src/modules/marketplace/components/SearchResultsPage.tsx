'use client'

import { Alert, Box, Button } from '@mui/material'
import { useTranslations } from 'next-intl'

import { surface } from '@shared/theme/tokens'

import { getMarketplaceNavigationItemIdByPurpose } from '../config/navigation'
import { useSearchResults } from '../hooks/use-search-results'
import type { SearchResultsPageProps } from '../types/search'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'
import {
  SearchResultsFilterButton,
  SearchResultsFilters,
} from './search-results/SearchResultsFilters'
import { SearchResultsList } from './search-results/SearchResultsList'
import { SearchResultsMapPanel } from './search-results/SearchResultsMapPanel'
import { SearchResultsPagination } from './search-results/SearchResultsPagination'
import { SearchResultsToolbar } from './search-results/SearchResultsToolbar'

export function SearchResultsPage({ initialLocation = '', purpose }: SearchResultsPageProps) {
  const t = useTranslations('marketplace')
  const errorT = useTranslations('marketplace.searchResults.error')
  const results = useSearchResults({ purpose, initialLocation })
  const activeItemId = getMarketplaceNavigationItemIdByPurpose(purpose)
  const purposeLabel = purpose === 'comprar' ? t('navigation.buy') : t('navigation.rent')

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
      <MarketplaceHeader activeItemId={activeItemId} />

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
          <MarketplaceBreadcrumbs
            items={[{ label: t('navigation.home'), href: '/' }, { label: purposeLabel }]}
          />
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
          {results.isError ? (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => results.refetch()}>
                  {errorT('retry')}
                </Button>
              }
            >
              {errorT('title')}
            </Alert>
          ) : null}
          <SearchResultsList
            properties={results.filteredResults}
            isLoading={results.isLoading}
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
          searchQuery={results.locationQuery}
        />
      </Box>
    </Box>
  )
}
