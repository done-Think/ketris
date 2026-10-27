'use client'

import { Alert, Box, Button } from '@mui/material'
import { useTranslations } from 'next-intl'

import { SiteFooter } from '@shared/components/layout'

import { getMarketplaceNavigationItemIdByPurpose } from '../config/navigation'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
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
import { styles } from '../styles/search-results-page.styles'

export function SearchResultsPage(props: SearchResultsPageProps) {
  const { purpose } = props
  const t = useTranslations('marketplace')
  const errorT = useTranslations('marketplace.searchResults.error')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const results = useSearchResults(props)
  const activeItemId = getMarketplaceNavigationItemIdByPurpose(purpose)
  const purposeLabel = purpose === 'comprar' ? t('navigation.buy') : t('navigation.rent')

  return (
    <Box sx={styles.box}>
      <MarketplaceHeader activeItemId={activeItemId} />

      <Box component="main" sx={styles.box2}>
        <Box sx={styles.box3}>
          <MarketplaceBreadcrumbs
            items={[{ label: t('navigation.home'), href: '/' }, { label: purposeLabel }]}
          />
          <SearchResultsFilters
            locationQuery={results.filters.location}
            setLocationQuery={results.setLocationQuery}
          />
          <SearchResultsToolbar
            filtersControl={
              <SearchResultsFilterButton
                filters={results.filters}
                activeFiltersCount={results.activeFiltersCount}
                onApply={results.applyFilters}
              />
            }
            resultCount={results.resultCount}
            setSortOption={results.setSortOption}
            setViewMode={results.setViewMode}
            sortOption={results.sortOption}
            viewMode={results.viewMode}
          />
          {results.isError ? (
            <Alert
              severity="error"
              sx={styles.alert}
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
            properties={results.paginatedResults}
            isLoading={results.isLoading}
            selectedPropertyId={results.selectedPropertyId}
            setSelectedPropertyId={results.setSelectedPropertyId}
            viewMode={results.viewMode}
          />
          <SearchResultsPagination
            currentPage={results.currentPage}
            setCurrentPage={results.setCurrentPage}
            totalPages={results.totalPages}
          />
        </Box>

        <SearchResultsMapPanel
          properties={results.paginatedResults}
          selectedPropertyId={results.selectedPropertyId}
          setSelectedPropertyId={results.setSelectedPropertyId}
          searchQuery={results.filters.location}
        />
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
