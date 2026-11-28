'use client'

import { Alert, Box, Button, Container } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import { SiteFooter } from '@shared/components/layout'

import { useFavoriteProperties } from '../../hooks/use-favorite-properties'
import { useMarketplaceNavigation } from '../../hooks/use-marketplace-navigation'
import { toFavoriteCard } from '../../utils/favorite-properties'
import { DirectoryPageHeader } from '../directory/DirectoryPageHeader'
import { MarketplaceBreadcrumbs } from '../MarketplaceBreadcrumbs'
import { MarketplaceHeader } from '../MarketplaceHeader'
import { SearchResultsList } from '../search-results/SearchResultsList'
import { styles } from '../../styles/brokers-page.styles'
import { FavoritesEmptyState } from './FavoritesEmptyState'

export function FavoritesPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace')
  const tPage = useTranslations('marketplace.favorites.page')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const { status } = useSession()
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const favorites = useFavoriteProperties()
  const cards = (favorites.data?.favorites ?? []).flatMap((entry) =>
    entry.available ? [toFavoriteCard(entry, 'all', locale, tFeatures)] : [],
  )

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
    if (!favorites.isSuccess) return <SearchResultsList properties={[]} isLoading viewMode="grid" />
    if (cards.length === 0) return <FavoritesEmptyState variant="empty" />

    return <SearchResultsList properties={cards} viewMode="grid" />
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
            resultCountLabel={favorites.isSuccess ? tPage('count', { count: cards.length }) : ''}
          />
          {renderContent()}
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
