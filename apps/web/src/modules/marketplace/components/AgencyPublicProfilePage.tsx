'use client'

import { useRef, useState } from 'react'
import { Avatar, Box, Container, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import Link from 'next/link'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { radius, surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import type { AgencyPublicProfilePageProps } from '../types/agency'
import { brokers } from '../data/brokers'
import { profileActions, userProfile } from '../data/user-profile'
import { formatRating } from '../utils/format-rating'
import { buildProfileListings } from '../utils/profile-listings'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { AgencyProfileHero } from './profile/AgencyProfileHero'
import { PublicProfileListings } from './profile/PublicProfileListings'
import { PublicProfileMetrics } from './profile/PublicProfileMetrics'
import { PublicProfileSidebar } from './profile/PublicProfileSidebar'

export function AgencyPublicProfilePage({ agency }: AgencyPublicProfilePageProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const highlightedTeam = agency.teamHighlights.flatMap((person) => {
    const broker = brokers.find((brokerItem) => brokerItem.name === person)

    return broker ? [broker] : []
  })
  const representedListings = buildProfileListings(agency.featuredListings, {
    coverage: agency.coverage,
  })
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href === '/imobiliarias',
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
                { label: 'Nota', value: formatRating(agency.rating), icon: StarRoundedIcon },
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
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.2,
                }}
              >
                {highlightedTeam.map((broker) => (
                  <Box
                    key={broker.href}
                    component={Link}
                    href={broker.href}
                    sx={{
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: `${radius.sm}px`,
                      bgcolor: agency.brand.backgroundColor,
                      color: 'inherit',
                      display: 'flex',
                      gap: 1.2,
                      minHeight: 68,
                      px: 1.2,
                      py: 1,
                      textDecoration: 'none',
                      transition: 'border-color 180ms ease, box-shadow 180ms ease',
                      '&:hover': {
                        borderColor: agency.brand.primaryColor,
                        boxShadow: `0 12px 28px ${agency.brand.primaryColor}1F`,
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${agency.brand.primaryColor}`,
                        outlineOffset: 3,
                      },
                    }}
                  >
                    <Avatar
                      src={broker.avatar}
                      alt={broker.name}
                      sx={{ width: 42, height: 42, flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          color: agency.brand.secondaryColor,
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {broker.name}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          color: 'text.secondary',
                          fontSize: 11,
                          fontWeight: 600,
                          mt: 0.2,
                        }}
                      >
                        {broker.region}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
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
