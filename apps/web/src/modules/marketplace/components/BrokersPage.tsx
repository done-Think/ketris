'use client'

import { Box, Container } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { SiteFooter } from '@shared/components/layout'

import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { useDirectoryList } from '../hooks/use-directory-list'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import { brokerProfileService } from '../services/broker-profile-service'
import { toBrokerProfile } from '../utils/broker-profile-adapter'
import { useViewModePreference } from '../hooks/use-view-mode-preference'
import { BrokerCard } from './BrokerCard'
import { DirectoryLoadMoreStatus } from './directory/DirectoryLoadMoreStatus'
import { DirectoryPageHeader } from './directory/DirectoryPageHeader'
import { DirectoryViewModeToggle } from './directory/DirectoryViewModeToggle'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'
import { styles, getBoxStyles } from '../styles/brokers-page.styles'

const directoryPageSize = 12

export function BrokersPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const directoryT = useTranslations('marketplace.directory.brokers')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const { setViewMode, viewMode } = useViewModePreference('brokers')
  const directory = useDirectoryList({
    queryKey: marketplaceQueryKeys.brokers,
    fetchPage: (query) => brokerProfileService.list(query),
    toItem: (profile) => toBrokerProfile(profile, locale, tFeatures),
    pageSize: directoryPageSize,
  })

  return (
    <Box sx={styles.box}>
      <MarketplaceHeader activeItemId="brokers" />

      <Box component="main" sx={styles.box2}>
        <Container maxWidth="xl">
          <MarketplaceBreadcrumbs
            items={[{ label: t('navigation.home'), href: '/' }, { label: t('navigation.brokers') }]}
          />
          <DirectoryPageHeader
            actions={<DirectoryViewModeToggle value={viewMode} onChange={setViewMode} />}
            placeholder={directoryT('placeholder')}
            resultCountLabel={directoryT('resultCount', {
              visible: directory.items.length,
              total: directory.totalCount,
            })}
            search={directory.search}
            onSearchChange={directory.setSearch}
            title={directoryT('title')}
          />

          <Box sx={getBoxStyles({ viewMode })}>
            {directory.items.map((broker) => (
              <BrokerCard key={broker.id} {...broker} viewMode={viewMode} />
            ))}
          </Box>

          <DirectoryLoadMoreStatus
            emptyLabel={directoryT('empty')}
            hasItems={directory.items.length > 0}
            hasMoreItems={directory.hasMoreItems}
            isLoadingMore={directory.isLoadingMore}
            loadedLabel={directoryT('loaded')}
            loadingLabel={directoryT('loading')}
            loadMoreRef={directory.loadMoreRef}
          />
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
