'use client'

import { Box, Container } from '@mui/material'

import { SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { footerColumns, legalLinks } from '../config/navigation'
import { agencies } from '../data/agencies'
import { useDirectoryList } from '../hooks/use-directory-list'
import type { AgencyProfile } from '../types/agency'
import { useViewModePreference } from '../hooks/use-view-mode-preference'
import { AgencyCard } from './AgencyCard'
import { DirectoryLoadMoreStatus } from './directory/DirectoryLoadMoreStatus'
import { DirectoryPageHeader } from './directory/DirectoryPageHeader'
import { DirectoryViewModeToggle } from './directory/DirectoryViewModeToggle'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'

const initialAgencyCount = 4
const agencyPageSize = 3

function getAgencySearchableText(agency: AgencyProfile) {
  return `${agency.name} ${agency.legalCreci} ${agency.headquarters} ${agency.coverage.join(
    ' ',
  )} ${agency.segments.join(' ')}`
}

export function AgenciesPage() {
  const { setViewMode, viewMode } = useViewModePreference('imobiliarias')
  const {
    filteredItems: filteredAgencies,
    hasMoreItems: hasMoreAgencies,
    isLoadingMore,
    loadMoreRef,
    register,
    visibleItems: visibleAgencies,
  } = useDirectoryList({
    getSearchableText: getAgencySearchableText,
    initialCount: initialAgencyCount,
    items: agencies,
    pageSize: agencyPageSize,
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
      <MarketplaceHeader activeItemId="agencies" />

      <Box component="main" sx={{ py: { xs: 2.4, md: 4 } }}>
        <Container maxWidth="xl">
          <MarketplaceBreadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Imobiliárias' }]}
          />
          <DirectoryPageHeader
            actions={<DirectoryViewModeToggle value={viewMode} onChange={setViewMode} />}
            placeholder="Nome, CRECI, região ou cobertura"
            resultCountLabel={`${visibleAgencies.length} de ${filteredAgencies.length} imobiliárias encontradas`}
            searchInputProps={register('searchQuery')}
            title="Imobiliárias"
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
            {visibleAgencies.map((agency) => (
              <AgencyCard key={agency.id} {...agency} viewMode={viewMode} />
            ))}
          </Box>

          <DirectoryLoadMoreStatus
            emptyLabel="Nenhuma imobiliária encontrada"
            hasItems={Boolean(filteredAgencies.length)}
            hasMoreItems={hasMoreAgencies}
            isLoadingMore={isLoadingMore}
            loadedLabel="Todas as imobiliárias foram carregadas"
            loadingLabel="Carregando mais imobiliárias"
            loadMoreRef={loadMoreRef}
          />
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
