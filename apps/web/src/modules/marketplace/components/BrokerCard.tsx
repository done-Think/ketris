'use client'

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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

import type { BrokerCardProps } from '../types/broker'
import { buildProfileListings } from '../utils/profile-listings'

export function BrokerCard(brokerCardProps: BrokerCardProps) {
  const isListView = brokerCardProps.viewMode === 'list'
  const highlightedListings = buildProfileListings(brokerCardProps.highlightedListings).slice(0, 2)

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
          p: { xs: 2, md: isListView ? 2.6 : 2.4 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={isListView ? 2.2 : 1.6} alignItems="flex-start">
            <Avatar
              src={brokerCardProps.avatar}
              alt={brokerCardProps.name}
              sx={{
                width: isListView ? { xs: 68, md: 86 } : 58,
                height: isListView ? { xs: 68, md: 86 } : 58,
                boxShadow: `0 0 0 3px ${alpha.magenta[8]}`,
              }}
            />

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                spacing={1}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...componentText.cardTitle, mb: 0.4 }}>
                    {brokerCardProps.name}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', ...componentText.cardBroker }}>
                    {brokerCardProps.creci}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.35}>
                  <StarRoundedIcon sx={{ color: 'primary.main', fontSize: iconSize.sm }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                    {brokerCardProps.rating}
                  </Typography>
                </Stack>
              </Stack>

              <Typography sx={{ color: 'text.secondary', ...componentText.cardMeta, mt: 1 }}>
                {brokerCardProps.region}
              </Typography>
              {isListView ? (
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1.5,
                    mt: 1.2,
                  }}
                >
                  {brokerCardProps.bio}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1.8 }}>
            {brokerCardProps.specialties.map((specialty) => (
              <Chip
                key={specialty}
                label={specialty}
                size="small"
                sx={{
                  height: 26,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: alpha.magenta[6],
                  color: 'primary.main',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              />
            ))}
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '2fr 0.85fr 0.85fr' },
              gap: 1,
              mt: 2,
            }}
          >
            {[
              { label: 'Região', value: brokerCardProps.region },
              { label: 'Imóveis', value: `${brokerCardProps.activeListings} ativos` },
              { label: 'Resposta', value: brokerCardProps.responseTime },
            ].map((item) => {
              const isRegion = item.value === brokerCardProps.region

              return (
                <Tooltip
                  key={item.label}
                  title={isRegion ? item.value : ''}
                  placement="bottom-start"
                  disableHoverListener={!isRegion}
                >
                  <Box
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
                    <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 800 }}>
                      {item.label}
                    </Typography>
                    <Typography
                      noWrap={!isRegion}
                      sx={{
                        fontSize: 12,
                        fontWeight: 900,
                        lineHeight: 1.25,
                        mt: 0.25,
                        wordBreak: isRegion ? 'break-word' : undefined,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                </Tooltip>
              )
            })}
          </Box>
        </Box>

        {isListView ? (
          <Box
            sx={{
              minWidth: 0,
              borderLeft: { md: '1px solid' },
              borderTop: { xs: '1px solid', md: 0 },
              borderColor: 'divider',
              pl: { md: 2.4 },
              pt: { xs: 2, md: 0 },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 1.2 }}>
              <HomeWorkOutlinedIcon sx={{ color: 'primary.main', fontSize: iconSize.sm }} />
              <Typography sx={{ fontSize: 12, fontWeight: 900 }}>Imóveis em destaque</Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1,
              }}
            >
              {highlightedListings.map((listing) => (
                <Box
                  component={Link}
                  href={listing.href}
                  key={listing.href}
                  sx={{
                    display: 'block',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.app,
                    color: 'inherit',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    transition: motion.transition.bordered,
                    '&:hover': {
                      borderColor: 'primary.main',
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
                        sx={{ color: 'primary.main', fontSize: 14, fontWeight: 900 }}
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
            href={brokerCardProps.href}
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
