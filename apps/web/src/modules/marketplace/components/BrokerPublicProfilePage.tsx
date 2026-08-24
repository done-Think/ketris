'use client'

import { useRef, useState } from 'react'
import { Box, Container } from '@mui/material'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { getBrokerProfileTheme } from '../config/broker-profile-themes'
import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import type { BrokerPublicProfilePageProps } from '../types/broker'
import { formatRating } from '../utils/format-rating'
import { buildProfileListings } from '../utils/profile-listings'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { BrokerProfileHero } from './profile/BrokerProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'

export function BrokerPublicProfilePage({ broker }: BrokerPublicProfilePageProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const theme = getBrokerProfileTheme(broker.id)
  const representedListings = buildProfileListings(broker.highlightedListings, {
    brokerName: broker.name,
    coverage: broker.neighborhoods,
  })
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href === '/corretores',
  }))

  return (
    <Box sx={{ bgcolor: surface.app, minHeight: '100vh' }}>
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
                { label: 'Nota', value: formatRating(broker.rating) },
                { label: 'Tempo médio', value: broker.responseTime },
                { label: 'Ativos', value: broker.activeListings },
                { label: 'Fechados', value: broker.dealsClosed },
              ]}
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
