'use client'

import { Box, Container } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import { useTranslations } from 'next-intl'

import { SiteFooter } from '@shared/components/layout'

import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { AgencyPublicProfilePageProps } from '../types/agency'
import { buildProfileListings } from '../utils/profile-listings'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'
import { AgencyHighlightedTeam } from './profile/AgencyHighlightedTeam'
import { AgencyProfileHero } from './profile/AgencyProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'
import { styles } from '../styles/agency-public-profile-page.styles'

export function AgencyPublicProfilePage({ agency }: AgencyPublicProfilePageProps) {
  const t = useTranslations('marketplace')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const representedListings = buildProfileListings(agency.featuredListings)

  return (
    <Box sx={styles.box}>
      <MarketplaceHeader activeItemId="agencies" />

      <Container component="main" maxWidth="xl" sx={styles.container}>
        <MarketplaceBreadcrumbs
          items={[
            { label: t('navigation.home'), href: '/' },
            { label: t('navigation.agencies'), href: '/agencies' },
            { label: agency.name },
          ]}
        />
        <Box sx={styles.box2}>
          <Box sx={styles.box3}>
            <AgencyProfileHero agency={agency} />
            <PublicProfileMetrics
              accentColor={agency.brand.primaryColor ?? ''}
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
                ...(agency.yearsInMarket !== null
                  ? [
                      {
                        label: t('publicProfile.metrics.years'),
                        value: agency.yearsInMarket,
                        icon: HomeWorkOutlinedIcon,
                      },
                    ]
                  : []),
              ]}
            />
            <AgencyHighlightedTeam brand={agency.brand} team={agency.teamHighlights} />
          </Box>

          <PublicProfileSidebar
            accentColor={agency.brand.primaryColor ?? ''}
            hoverColor={agency.brand.backgroundColor ?? ''}
            href={agency.href}
            sourceType="agency"
            linkDescription={t('publicProfile.sidebar.agencyLinkDescription')}
            phone={agency.phone ?? ''}
            email={agency.email ?? ''}
            facts={[
              ...(agency.address
                ? [{ label: t('publicProfile.facts.address'), value: agency.address }]
                : []),
              { label: t('publicProfile.facts.coverage'), value: agency.coverage.join(', ') },
              { label: t('publicProfile.facts.deals'), value: `${agency.dealsClosed}` },
            ]}
          />

          <Box sx={styles.box4}>
            <PublicProfileListings
              accentColor={agency.brand.primaryColor ?? ''}
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
