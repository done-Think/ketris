'use client'

import { Box, Container } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'

import { SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { footerColumns, legalLinks } from '../config/navigation'
import type { AgencyPublicProfilePageProps } from '../types/agency'
import { getBrokersByNames } from '../data/brokers'
import { buildProfileListings } from '../utils/profile-listings'
import { MarketplaceHeader } from './MarketplaceHeader'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { AgencyHighlightedTeam } from './profile/AgencyHighlightedTeam'
import { AgencyProfileHero } from './profile/AgencyProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'

export function AgencyPublicProfilePage({ agency }: AgencyPublicProfilePageProps) {
  const highlightedTeam = getBrokersByNames(agency.teamHighlights)
  const representedListings = buildProfileListings(agency.featuredListings, {
    coverage: agency.coverage,
  })

  return (
    <Box sx={{ bgcolor: surface.app, minHeight: '100vh', overflowX: 'clip' }}>
      <MarketplaceHeader activeItemId="agencies" />

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
        <MarketplaceBreadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Imobiliárias', href: '/imobiliarias' },
            { label: agency.name },
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
            <AgencyProfileHero agency={agency} />
            <PublicProfileMetrics
              accentColor={agency.brand.primaryColor}
              metrics={[
                { label: 'Imóveis', value: agency.activeListings, icon: ApartmentOutlinedIcon },
                { label: 'Equipe', value: agency.brokersCount, icon: GroupsOutlinedIcon },
                { label: 'Anos', value: agency.yearsInMarket, icon: HomeWorkOutlinedIcon },
                { label: 'Nota', value: agency.rating, icon: StarRoundedIcon },
              ]}
            />
            <AgencyHighlightedTeam brand={agency.brand} brokers={highlightedTeam} />
          </Box>

          <PublicProfileSidebar
            accentColor={agency.brand.primaryColor}
            hoverColor={agency.brand.backgroundColor}
            href={agency.href}
            linkDescription="Use este endereço como página própria da imobiliária."
            phone={agency.phone}
            email={agency.email}
            facts={[
              { label: 'Endereço', value: agency.address },
              { label: 'Cobertura', value: agency.coverage.join(', ') },
              { label: 'Resposta', value: agency.responseTime },
              { label: 'Negociações', value: `${agency.dealsClosed}` },
            ]}
          />

          <Box sx={{ gridColumn: { lg: '1 / -1' } }}>
            <PublicProfileListings
              accentColor={agency.brand.primaryColor}
              listings={representedListings}
              source={{ href: agency.href, name: agency.name, type: 'agency' }}
            />
          </Box>
        </Box>
      </Container>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
