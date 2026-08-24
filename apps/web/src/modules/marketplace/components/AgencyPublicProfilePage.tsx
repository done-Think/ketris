'use client'

import { Box, Chip, Container, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'

import { HomeHeader, SiteFooter } from '@shared/components/layout'
import { radius, surface } from '@shared/theme/tokens'

import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { AgencyPublicProfilePageProps } from '../types/agency'
import { buildProfileListings } from '../utils/profile-listings'
import { AgencyProfileHero } from './profile/AgencyProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'

export function AgencyPublicProfilePage({ agency }: AgencyPublicProfilePageProps) {
  const { footerColumns, homeNavigationItems, legalLinks } = useMarketplaceNavigation()
  const representedListings = buildProfileListings(agency.featuredListings)
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.key === 'agencies',
  }))

  return (
    <Box sx={{ bgcolor: surface.app, minHeight: '100vh', overflowX: 'clip' }}>
      <HomeHeader navigationItems={navigationItems} />

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
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
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                p: { xs: 2, md: 2.4 },
                mb: 2.5,
              }}
            >
              <Typography variant="h5" sx={{ mb: 1.4 }}>
                Equipe em destaque
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {agency.teamHighlights.map((person) => (
                  <Chip
                    key={person}
                    label={person}
                    sx={{
                      borderRadius: `${radius.sm}px`,
                      bgcolor: agency.brand.backgroundColor,
                      color: agency.brand.secondaryColor,
                      fontWeight: 700,
                    }}
                  />
                ))}
              </Stack>
            </Box>
            <PublicProfileListings
              accentColor={agency.brand.primaryColor}
              listings={representedListings}
            />
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
        </Box>
      </Container>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
