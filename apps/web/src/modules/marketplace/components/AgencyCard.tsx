'use client'

import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import Link from 'next/link'

import { PillBadge } from '@shared/components/ui'
import {
  alpha,
  componentText,
  iconSize,
  motion,
  radius,
  shadows,
  surface,
} from '@shared/theme/tokens'

import type { AgencyCardProps } from '../types/agency'
import { buildProfileListings } from '../utils/profile-listings'
import { AgencyBrandBanner } from './AgencyBrandBanner'

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

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 1,
              mt: 2,
            }}
          >
            {[
              { label: 'Imóveis', value: agency.activeListings, icon: ApartmentOutlinedIcon },
              { label: 'Equipe', value: agency.brokersCount, icon: GroupsOutlinedIcon },
              { label: 'Nota', value: agency.rating, icon: StarRoundedIcon },
            ].map(({ label, value, icon: Icon }) => (
              <Box
                key={label}
                sx={{
                  minWidth: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: `${radius.sm}px`,
                  px: 1,
                  py: 1,
                  bgcolor: surface.app,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.45}>
                  <Icon sx={{ color: 'text.secondary', fontSize: iconSize.xs }} />
                  <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 700 }}>
                    {label}
                  </Typography>
                </Stack>
                <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, mt: 0.25 }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {isListView ? (
          <Box
            sx={{
              minWidth: 0,
              borderLeft: { lg: '1px solid' },
              borderTop: { xs: '1px solid', lg: 0 },
              borderColor: 'divider',
              pl: { lg: 2.4 },
              pt: { xs: 2, lg: 0 },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 1.2 }}>
              <HomeWorkOutlinedIcon
                sx={{ color: agency.brand.primaryColor, fontSize: iconSize.sm }}
              />
              <Typography sx={{ fontSize: 12, fontWeight: 900 }}>Imóveis em destaque</Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1,
              }}
            >
              {featuredListings.map((listing) => (
                <Box
                  component={Link}
                  href={listing.href}
                  key={listing.href}
                  sx={{
                    display: 'block',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: `${radius.sm}px`,
                    bgcolor: agency.brand.backgroundColor,
                    color: 'inherit',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    transition: motion.transition.bordered,
                    '&:hover': {
                      borderColor: agency.brand.primaryColor,
                      boxShadow: shadows.propertyCard,
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: 118,
                      bgcolor: surface.paper,
                      backgroundImage: listing.image ? `url("${listing.image}")` : undefined,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }}
                  >
                    <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                      <PillBadge>DESTAQUE</PillBadge>
                    </Box>
                  </Box>
                  <Box sx={{ minWidth: 0, px: 1, py: 0.75 }}>
                    <Typography
                      noWrap
                      sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 900 }}
                    >
                      {listing.location}
                    </Typography>
                    <Stack
                      direction="row"
                      alignItems="end"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography
                        noWrap
                        sx={{ color: agency.brand.primaryColor, fontSize: 14, fontWeight: 900 }}
                      >
                        {listing.price}
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, max-content)',
                          columnGap: 0.55,
                          rowGap: 0.2,
                          flex: '0 0 auto',
                        }}
                      >
                        {listing.details.slice(0, 4).map((detail) => (
                          <Typography
                            key={detail.key}
                            noWrap
                            sx={{ color: 'text.secondary', fontSize: 9.5, fontWeight: 700 }}
                          >
                            {detail.label}
                          </Typography>
                        ))}
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
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
