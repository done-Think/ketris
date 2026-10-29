'use client'

import { Box, Container } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { SiteFooter } from '@shared/components/layout'

import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { useDirectoryList } from '../hooks/use-directory-list'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import { agencyProfileService } from '../services/agency-profile-service'
import { toAgencyProfile } from '../utils/agency-profile-adapter'
import { useViewModePreference } from '../hooks/use-view-mode-preference'
import { AgencyCard } from './AgencyCard'
import { DirectoryLoadMoreStatus } from './directory/DirectoryLoadMoreStatus'
import { DirectoryPageHeader } from './directory/DirectoryPageHeader'
import { DirectoryViewModeToggle } from './directory/DirectoryViewModeToggle'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'
import { styles, getBoxStyles } from '../styles/agencies-page.styles'

const directoryPageSize = 12

export function AgenciesPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const directoryT = useTranslations('marketplace.directory.agencies')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const { setViewMode, viewMode } = useViewModePreference('agencies')
  const directory = useDirectoryList({
    queryKey: marketplaceQueryKeys.agencies,
    fetchPage: (query) => agencyProfileService.list(query),
    toItem: (profile) => toAgencyProfile(profile, locale, tFeatures),
    pageSize: directoryPageSize,
  })

  return (
    <Box sx={styles.box}>
      <MarketplaceHeader activeItemId="agencies" />

      <Box component="main" sx={styles.box2}>
        <Container maxWidth="xl">
          <MarketplaceBreadcrumbs
            items={[
              { label: t('navigation.home'), href: '/' },
              { label: t('navigation.agencies') },
            ]}
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
            {directory.items.map((agency) => (
              <AgencyCard key={agency.id} {...agency} viewMode={viewMode} />
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
