'use client'

import { Box, Container } from '@mui/material'
import { useTranslations } from 'next-intl'

import { SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { brokers } from '../data/brokers'
import { useDirectoryList } from '../hooks/use-directory-list'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { BrokerProfile } from '../types/broker'
import { useViewModePreference } from '../hooks/use-view-mode-preference'
import { BrokerCard } from './BrokerCard'
import { DirectoryLoadMoreStatus } from './directory/DirectoryLoadMoreStatus'
import { DirectoryPageHeader } from './directory/DirectoryPageHeader'
import { DirectoryViewModeToggle } from './directory/DirectoryViewModeToggle'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'

const initialBrokerCount = 4
const brokerPageSize = 3

function getBrokerSearchableText(broker: BrokerProfile) {
  return `${broker.name} ${broker.creci} ${broker.region} ${broker.neighborhoods.join(
    ' ',
  )} ${broker.specialties.join(' ')}`
}

export function BrokersPage() {
  const t = useTranslations('marketplace')
  const directoryT = useTranslations('marketplace.directory.brokers')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const { setViewMode, viewMode } = useViewModePreference('brokers')
  const {
    filteredItems: filteredBrokers,
    hasMoreItems: hasMoreBrokers,
    isLoadingMore,
    loadMoreRef,
    register,
    visibleItems: visibleBrokers,
  } = useDirectoryList({
    getSearchableText: getBrokerSearchableText,
    initialCount: initialBrokerCount,
    items: brokers,
    pageSize: brokerPageSize,
  })

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
              visible: visibleBrokers.length,
              total: filteredBrokers.length,
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
            {visibleBrokers.map((broker) => (
              <BrokerCard key={broker.id} {...broker} viewMode={viewMode} />
            ))}
          </Box>

          <DirectoryLoadMoreStatus
            emptyLabel={directoryT('empty')}
            hasItems={Boolean(filteredBrokers.length)}
            hasMoreItems={hasMoreBrokers}
            isLoadingMore={isLoadingMore}
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
