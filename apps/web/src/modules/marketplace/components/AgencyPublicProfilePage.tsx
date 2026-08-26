'use client'

import { Box, Container } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { useTranslations } from 'next-intl'

import { SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { getBrokersByNames } from '../data/brokers'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { AgencyPublicProfilePageProps } from '../types/agency'
import { formatRating } from '../utils/format-rating'
import { buildProfileListings } from '../utils/profile-listings'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'
import { AgencyHighlightedTeam } from './profile/AgencyHighlightedTeam'
import { AgencyProfileHero } from './profile/AgencyProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'

export function AgencyPublicProfilePage({ agency }: AgencyPublicProfilePageProps) {
  const t = useTranslations('marketplace')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
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
            { label: t('navigation.home'), href: '/' },
            { label: t('navigation.agencies'), href: '/agencies' },
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
                {
                  label: t('publicProfile.metrics.properties'),
                  value: agency.activeListings,
                  icon: ApartmentOutlinedIcon,
                },
                {
                  label: t('publicProfile.metrics.team'),
                  value: agency.brokersCount,
                  icon: GroupsOutlinedIcon,
                },
                {
                  label: t('publicProfile.metrics.years'),
                  value: agency.yearsInMarket,
                  icon: HomeWorkOutlinedIcon,
                },
                {
                  label: t('publicProfile.metrics.rating'),
                  value: formatRating(agency.rating),
                  icon: StarRoundedIcon,
                },
              ]}
            />
            <AgencyHighlightedTeam brand={agency.brand} brokers={highlightedTeam} />
          </Box>

          <PublicProfileSidebar
            accentColor={agency.brand.primaryColor}
            hoverColor={agency.brand.backgroundColor}
            href={agency.href}
            sourceType="agency"
            linkDescription={t('publicProfile.sidebar.agencyLinkDescription')}
            phone={agency.phone}
            email={agency.email}
            facts={[
              { label: t('publicProfile.facts.address'), value: agency.address },
              { label: t('publicProfile.facts.coverage'), value: agency.coverage.join(', ') },
              { label: t('publicProfile.facts.response'), value: agency.responseTime },
              { label: t('publicProfile.facts.deals'), value: `${agency.dealsClosed}` },
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
