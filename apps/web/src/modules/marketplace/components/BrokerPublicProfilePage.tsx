'use client'

import { Box, Container } from '@mui/material'

import { SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { getBrokerProfileTheme } from '../config/broker-profile-themes'
import { footerColumns, legalLinks } from '../config/navigation'
import type { BrokerPublicProfilePageProps } from '../types/broker'
import { buildProfileListings } from '../utils/profile-listings'
import { MarketplaceHeader } from './MarketplaceHeader'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { BrokerProfileHero } from './profile/BrokerProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'

export function BrokerPublicProfilePage({ broker }: BrokerPublicProfilePageProps) {
  const theme = getBrokerProfileTheme(broker.id)
  const representedListings = buildProfileListings(broker.highlightedListings)

  return (
    <Box sx={{ bgcolor: surface.app, minHeight: '100vh', overflowX: 'clip' }}>
      <MarketplaceHeader activeItemId="brokers" />

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
        <MarketplaceBreadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Corretores', href: '/corretores' },
            { label: broker.name },
          ]}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
            gap: { xs: 2.5, lg: 3 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <BrokerProfileHero broker={broker} theme={theme} />
            <PublicProfileMetrics
              accentColor={theme.accent}
              metrics={[
                { label: 'Nota', value: broker.rating },
                { label: 'Tempo médio', value: broker.responseTime },
                { label: 'Ativos', value: broker.activeListings },
                { label: 'Fechados', value: broker.dealsClosed },
              ]}
            />
            <PublicProfileListings
              accentColor={theme.accent}
              listings={representedListings}
              source={{ href: broker.href, name: broker.name, type: 'broker' }}
            />
          </Box>

          <PublicProfileSidebar
            accentColor={theme.accent}
            hoverColor={theme.tone}
            href={broker.href}
            linkDescription="Use este endereço como página própria do corretor."
            phone={broker.phone}
            email={broker.email}
            facts={[
              { label: 'Atendimento', value: broker.availability },
              { label: 'Bairros', value: broker.neighborhoods.join(', ') },
              { label: 'Imóveis ativos', value: `${broker.activeListings}` },
              { label: 'Negociações', value: `${broker.dealsClosed}` },
            ]}
          />
        </Box>
      </Container>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
