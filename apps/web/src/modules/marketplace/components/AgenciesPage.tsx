'use client'

import { useRef, useState } from 'react'
import { Box, Container } from '@mui/material'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { agencies } from '../data/agencies'
import { profileActions, userProfile } from '../data/user-profile'
import { useDirectoryList } from '../hooks/use-directory-list'
import type { AgencyProfile } from '../types/agency'
import { AgencyCard } from './AgencyCard'
import { DirectoryLoadMoreStatus } from './directory/DirectoryLoadMoreStatus'
import { DirectoryPageHeader } from './directory/DirectoryPageHeader'

const initialAgencyCount = 4
const agencyPageSize = 3

function getAgencySearchableText(agency: AgencyProfile) {
  return `${agency.name} ${agency.legalCreci} ${agency.headquarters} ${agency.coverage.join(
    ' ',
  )} ${agency.segments.join(' ')}`
}

export function AgenciesPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
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
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href === '/imobiliarias',
  }))

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

      <Box component="main" sx={{ py: { xs: 2.4, md: 4 } }}>
        <Container maxWidth="xl">
          <DirectoryPageHeader
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
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
              gap: { xs: 2, xl: 2.5 },
            }}
          >
            {visibleAgencies.map((agency) => (
              <AgencyCard key={agency.id} {...agency} />
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
