'use client'

import { Box, Container } from '@mui/material'

import { HomeHeader, SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { brokers } from '../data/brokers'
import { useDirectoryList } from '../hooks/use-directory-list'
import type { BrokerProfile } from '../types/broker'
import { BrokerCard } from './BrokerCard'
import { DirectoryLoadMoreStatus } from './directory/DirectoryLoadMoreStatus'
import { DirectoryPageHeader } from './directory/DirectoryPageHeader'

const initialBrokerCount = 4
const brokerPageSize = 3

function getBrokerSearchableText(broker: BrokerProfile) {
  return `${broker.name} ${broker.creci} ${broker.region} ${broker.neighborhoods.join(
    ' ',
  )} ${broker.specialties.join(' ')}`
}

export function BrokersPage() {
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
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href === '/corretores',
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
      <HomeHeader navigationItems={navigationItems} />

      <Box component="main" sx={{ py: { xs: 2.4, md: 4 } }}>
        <Container maxWidth="xl">
          <DirectoryPageHeader
            placeholder="Nome, CRECI, bairro ou região"
            resultCountLabel={`${visibleBrokers.length} de ${filteredBrokers.length} corretores encontrados`}
            searchInputProps={register('searchQuery')}
            title="Corretores"
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
            {visibleBrokers.map((broker) => (
              <BrokerCard key={broker.id} {...broker} />
            ))}
          </Box>

          <DirectoryLoadMoreStatus
            emptyLabel="Nenhum corretor encontrado"
            hasItems={Boolean(filteredBrokers.length)}
            hasMoreItems={hasMoreBrokers}
            isLoadingMore={isLoadingMore}
            loadedLabel="Todos os corretores foram carregados"
            loadingLabel="Carregando mais corretores"
            loadMoreRef={loadMoreRef}
          />
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
