'use client'

import { Box, Container } from '@mui/material'
import { useTranslations } from 'next-intl'

import { SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { getBrokerProfileTheme } from '../config/broker-profile-themes'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { BrokerPublicProfilePageProps } from '../types/broker'
import { formatRating } from '../utils/format-rating'
import { buildProfileListings } from '../utils/profile-listings'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'
import { BrokerProfileHero } from './profile/BrokerProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'

export function BrokerPublicProfilePage({ broker }: BrokerPublicProfilePageProps) {
  const t = useTranslations('marketplace')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const theme = getBrokerProfileTheme(broker.id)
  const representedListings = buildProfileListings(broker.highlightedListings, {
    brokerName: broker.name,
    coverage: broker.neighborhoods,
  })

  return (
    <Box sx={{ bgcolor: surface.app, minHeight: '100vh', overflowX: 'clip' }}>
      <MarketplaceHeader activeItemId="brokers" />

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
        <MarketplaceBreadcrumbs
          items={[
            { label: t('navigation.home'), href: '/' },
            { label: t('navigation.brokers'), href: '/brokers' },
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
                { label: t('publicProfile.metrics.rating'), value: formatRating(broker.rating) },
                { label: t('publicProfile.metrics.responseTime'), value: broker.responseTime },
                { label: t('publicProfile.metrics.active'), value: broker.activeListings },
                { label: t('publicProfile.metrics.closed'), value: broker.dealsClosed },
              ]}
            />
          </Box>

          <PublicProfileSidebar
            accentColor={theme.accent}
            hoverColor={theme.tone}
            href={broker.href}
            sourceType="broker"
            linkDescription={t('publicProfile.sidebar.brokerLinkDescription')}
            phone={broker.phone}
            email={broker.email}
            facts={[
              { label: t('publicProfile.facts.availability'), value: broker.availability },
              {
                label: t('publicProfile.facts.neighborhoods'),
                value: broker.neighborhoods.join(', '),
              },
              { label: t('publicProfile.facts.activeListings'), value: `${broker.activeListings}` },
              { label: t('publicProfile.facts.deals'), value: `${broker.dealsClosed}` },
            ]}
          />

          <Box sx={{ gridColumn: { lg: '1 / -1' } }}>
            <PublicProfileListings
              accentColor={theme.accent}
              listings={representedListings}
              source={{ href: broker.href, name: broker.name, type: 'broker' }}
            />
          </Box>
        </Box>
      </Container>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
