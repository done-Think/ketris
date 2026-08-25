'use client'

import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import Link from 'next/link'

import { alpha, componentText, iconSize, motion, radius, shadows } from '@shared/theme/tokens'

import type { AgencyCardProps } from '../types/agency'
import { buildProfileListings } from '../utils/profile-listings'
import { AgencyBrandBanner } from './AgencyBrandBanner'
import { DirectoryCardMetrics } from './directory/DirectoryCardMetrics'
import { ProfileListingPreviewSection } from './profile/ProfileListingPreviewSection'

export function AgencyCard(agency: AgencyCardProps) {
  const isListView = agency.viewMode === 'list'
  const featuredListings = buildProfileListings(agency.featuredListings).slice(0, 2)

  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: 'transparent',
        borderRadius: `${radius.sm}px`,
        color: 'inherit',
        boxShadow: shadows.propertyCard,
        overflow: 'hidden',
        transition: motion.transition.card,
        '&:hover': {
          borderColor: alpha.magenta[14],
          boxShadow: shadows.propertyCardHover,
          transform: 'translateY(-3px)',
        },
      }}
    >
      <CardContent
        sx={{
          display: isListView ? 'grid' : 'block',
          gridTemplateColumns: {
            lg: isListView ? 'minmax(0, 1fr) minmax(430px, 0.72fr)' : '1fr',
          },
          gap: { xs: 2, lg: 2.4 },
          p: { xs: 2, md: isListView ? 2.6 : 2.2 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ mb: isListView ? 1.6 : 0, p: isListView ? 0 : 1.3, pb: isListView ? 0 : 0 }}>
            <AgencyBrandBanner agency={agency} size={isListView ? 'hero' : 'compact'} />
          </Box>

          <Typography sx={{ ...componentText.cardTitle, mb: 0.4 }}>{agency.name}</Typography>
          <Typography sx={{ color: 'text.secondary', ...componentText.cardBroker }}>
            {agency.legalCreci} / {agency.headquarters}
          </Typography>
          {isListView ? (
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.5,
                mt: 1,
              }}
            >
              {agency.summary}
            </Typography>
          ) : null}

          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1.6 }}>
            {agency.segments.slice(0, 3).map((segment) => (
              <Chip
                key={segment}
                label={segment}
                size="small"
                sx={{
                  height: 26,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: alpha.magenta[6],
                  color: 'primary.main',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>

          <DirectoryCardMetrics
            gridTemplateColumns="repeat(3, minmax(0, 1fr))"
            labelFontWeight={700}
            metrics={[
              { label: 'Imóveis', value: agency.activeListings, icon: ApartmentOutlinedIcon },
              { label: 'Equipe', value: agency.brokersCount, icon: GroupsOutlinedIcon },
              { label: 'Nota', value: agency.rating, icon: StarRoundedIcon },
            ]}
            valueFontWeight={700}
          />
        </Box>

        {isListView ? (
          <ProfileListingPreviewSection
            accentColor={agency.brand.primaryColor}
            backgroundColor={agency.brand.backgroundColor}
            hoverBorderColor={agency.brand.primaryColor}
            listings={featuredListings}
            sideBorderBreakpoint="lg"
          />
        ) : null}

        <Box sx={{ gridColumn: '1 / -1' }}>
          <Divider sx={{ my: isListView ? 1.6 : 1.8 }} />

          <Stack
            component={Link}
            href={agency.href}
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            spacing={0.35}
            sx={{ textDecoration: 'none' }}
          >
            <Typography sx={{ color: 'primary.main', ...componentText.cardAction }}>
              Ver página pública
            </Typography>
            <ChevronRightIcon sx={{ color: 'primary.main', fontSize: iconSize.sm }} />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
