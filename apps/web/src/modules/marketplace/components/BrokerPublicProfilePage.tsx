'use client'

import { Box, Container } from '@mui/material'
import { useTranslations } from 'next-intl'

import { SiteFooter } from '@shared/components/layout'
import { brand, surface } from '@shared/theme/tokens'

import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { BrokerPublicProfilePageProps } from '../types/broker'
import { buildProfileListings } from '../utils/profile-listings'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'
import { BrokerProfileHero } from './profile/BrokerProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'
import { styles } from '../styles/broker-public-profile-page.styles'

export function BrokerPublicProfilePage({ broker, publicHandle }: BrokerPublicProfilePageProps) {
  const t = useTranslations('marketplace')
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const accentColor = broker.primaryColor ?? brand.magenta[500]
  const representedListings = buildProfileListings(broker.highlightedListings)

  return (
    <Box sx={styles.box}>
      <MarketplaceHeader activeItemId="brokers" />

      <Container component="main" maxWidth="xl" sx={styles.container}>
        <MarketplaceBreadcrumbs
          items={[
            { label: t('navigation.home'), href: '/' },
            { label: t('navigation.brokers'), href: '/brokers' },
            { label: broker.name },
          ]}
        />
        <Box sx={styles.box2}>
          <Box sx={styles.box3}>
            <BrokerProfileHero broker={broker} />
            <PublicProfileMetrics
              accentColor={accentColor}
              metrics={[
                { label: t('publicProfile.metrics.active'), value: broker.activeListings },
                { label: t('publicProfile.metrics.closed'), value: broker.dealsClosed },
              ]}
            />
          </Box>

          <PublicProfileSidebar
            accentColor={accentColor}
            hoverColor={broker.backgroundColor ?? surface.app}
            href={broker.href}
            publicHandle={publicHandle}
            sourceType="broker"
            linkDescription={t('publicProfile.sidebar.brokerLinkDescription')}
            phone={broker.phone ?? ''}
            email={broker.email}
            facts={[
              ...(broker.availability
                ? [{ label: t('publicProfile.facts.availability'), value: broker.availability }]
                : []),
              ...(broker.neighborhoods.length
                ? [
                    {
                      label: t('publicProfile.facts.neighborhoods'),
                      value: broker.neighborhoods.join(', '),
                    },
                  ]
                : []),
              { label: t('publicProfile.facts.activeListings'), value: `${broker.activeListings}` },
              { label: t('publicProfile.facts.deals'), value: `${broker.dealsClosed}` },
            ]}
          />

          <Box sx={styles.box4}>
            <PublicProfileListings
              accentColor={accentColor}
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
