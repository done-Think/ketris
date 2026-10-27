'use client'

import { Box, Container } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { useBrokerProfiles } from '../hooks/use-broker-profile'
import { useDirectorySearch, useLoadMoreOnScroll } from '../hooks/use-directory-list'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import { toBrokerProfile } from '../utils/broker-profile-adapter'
import { useViewModePreference } from '../hooks/use-view-mode-preference'
import { BrokerCard } from './BrokerCard'
import { DirectoryLoadMoreStatus } from './directory/DirectoryLoadMoreStatus'
import { DirectoryPageHeader } from './directory/DirectoryPageHeader'
import { DirectoryViewModeToggle } from './directory/DirectoryViewModeToggle'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'

export function BrokersPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const directoryT = useTranslations('marketplace.directory.brokers')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const { setViewMode, viewMode } = useViewModePreference('brokers')
  const { register, search } = useDirectorySearch()
  const brokersQuery = useBrokerProfiles(search)
  const brokers = (brokersQuery.data?.pages ?? []).flatMap((page) =>
    page.brokers.map((profile) => toBrokerProfile(profile, locale, tFeatures)),
  )
  const totalCount = brokersQuery.data?.pages[0]?.totalCount ?? 0
  const loadMoreRef = useLoadMoreOnScroll({
    enabled: brokersQuery.hasNextPage && !brokersQuery.isFetchingNextPage,
    onLoadMore: () => void brokersQuery.fetchNextPage(),
  })

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'clip',
        bgcolor: surface.app,
      }}
    >
      <MarketplaceHeader activeItemId="brokers" />

      <Box component="main" sx={{ py: { xs: 2.4, md: 4 } }}>
        <Container maxWidth="xl">
          <MarketplaceBreadcrumbs
            items={[{ label: t('navigation.home'), href: '/' }, { label: t('navigation.brokers') }]}
          />
          <DirectoryPageHeader
            actions={<DirectoryViewModeToggle value={viewMode} onChange={setViewMode} />}
            placeholder={directoryT('placeholder')}
            resultCountLabel={directoryT('resultCount', {
              visible: brokers.length,
              total: totalCount,
            })}
            searchInputProps={register('searchQuery')}
            title={directoryT('title')}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: viewMode === 'list' ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                xl: viewMode === 'list' ? '1fr' : 'repeat(3, minmax(0, 1fr))',
              },
              gap: { xs: 2, xl: 2.5 },
            }}
          >
            {brokers.map((broker) => (
              <BrokerCard key={broker.id} {...broker} viewMode={viewMode} />
            ))}
          </Box>

          <DirectoryLoadMoreStatus
            emptyLabel={directoryT('empty')}
            hasItems={brokers.length > 0}
            hasMoreItems={Boolean(brokersQuery.hasNextPage)}
            isLoadingMore={brokersQuery.isFetchingNextPage}
            loadedLabel={directoryT('loaded')}
            loadingLabel={directoryT('loading')}
            loadMoreRef={loadMoreRef}
          />
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
