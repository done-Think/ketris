'use client'

import { Alert, Box, Button, Container } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import { SiteFooter } from '@shared/components/layout'

import { useFavoriteProperties } from '../../hooks/use-favorite-properties'
import { useFavoritesFilters } from '../../hooks/use-favorites-filters'
import { useMarketplaceNavigation } from '../../hooks/use-marketplace-navigation'
import { useViewModePreference } from '../../hooks/use-view-mode-preference'
import type { UnavailableFavoriteEntry } from '../../types/favorite-property'
import { countFavorites, selectFavorites, toFavoriteCard } from '../../utils/favorite-properties'
import { DirectoryPageHeader } from '../directory/DirectoryPageHeader'
import { MarketplaceBreadcrumbs } from '../MarketplaceBreadcrumbs'
import { MarketplaceHeader } from '../MarketplaceHeader'
import { SearchResultsList } from '../search-results/SearchResultsList'
import { SearchResultsToolbar } from '../search-results/SearchResultsToolbar'
import { styles } from '../../styles/brokers-page.styles'
import { FavoritesEmptyState } from './FavoritesEmptyState'
import { FavoritesPurposeChips } from './FavoritesPurposeChips'
import { UnavailableFavorites } from './UnavailableFavorites'

export function FavoritesPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace')
  const tPage = useTranslations('marketplace.favorites.page')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const { status } = useSession()
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const { setViewMode, viewMode } = useViewModePreference('favorites')
  const { filters, setFilters } = useFavoritesFilters()
  const favorites = useFavoriteProperties()
  const entries = favorites.data?.favorites ?? []
  const visible = selectFavorites(entries, filters)
  const cards = visible.flatMap((entry) =>
    entry.available ? [toFavoriteCard(entry, filters.purpose, locale, tFeatures)] : [],
  )
  const unavailable = visible.filter((entry): entry is UnavailableFavoriteEntry => !entry.available)

  function renderContent() {
    if (status === 'unauthenticated') return <FavoritesEmptyState variant="guest" />
    if (favorites.isError)
      return (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void favorites.refetch()}>
              {tPage('retry')}
            </Button>
          }
        >
          {tPage('loadError')}
        </Alert>
      )
    if (!favorites.isSuccess)
      return <SearchResultsList properties={[]} isLoading viewMode={viewMode} />
    if (entries.length === 0) return <FavoritesEmptyState variant="empty" />

    return (
      <>
        <SearchResultsToolbar
          filtersControl={
            <FavoritesPurposeChips
              counts={countFavorites(entries)}
              value={filters.purpose}
              onChange={(purpose) => setFilters({ purpose })}
            />
          }
          resultCount={cards.length}
          sortOption={filters.sort}
          setSortOption={(sort) => setFilters({ sort })}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <SearchResultsList properties={cards} viewMode={viewMode} />
        {unavailable.length > 0 ? (
          <UnavailableFavorites entries={unavailable} viewMode={viewMode} />
        ) : null}
      </>
    )
  }

  return (
    <Box sx={styles.box}>
      <MarketplaceHeader />

      <Box component="main" sx={styles.box2}>
        <Container maxWidth="xl">
          <MarketplaceBreadcrumbs
            items={[{ label: t('navigation.home'), href: '/' }, { label: tPage('title') }]}
          />
          <DirectoryPageHeader
            title={tPage('title')}
            resultCountLabel={favorites.isSuccess ? tPage('count', { count: entries.length }) : ''}
          />
          {renderContent()}
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
