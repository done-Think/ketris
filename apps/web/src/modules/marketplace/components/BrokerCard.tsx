'use client'

import { type MouseEvent, useRef } from 'react'
import { Avatar, Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import Link from 'next/link'

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
import { DirectoryCardMetrics } from './directory/DirectoryCardMetrics'
import { ProfileListingPreviewSection } from './profile/ProfileListingPreviewSection'

export function BrokerCard(brokerCardProps: BrokerCardProps) {
  const profileLinkRef = useRef<HTMLAnchorElement | null>(null)
  const isListView = brokerCardProps.viewMode === 'list'
  const highlightedListings = buildProfileListings(brokerCardProps.highlightedListings).slice(0, 2)

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest('a')) return

    profileLinkRef.current?.click()
  }

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        border: '1px solid',
        borderColor: 'transparent',
        borderRadius: `${radius.sm}px`,
        color: 'inherit',
        boxShadow: shadows.propertyCard,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        transition: motion.transition.card,
        '&:hover': {
          borderColor: alpha.magenta[14],
          boxShadow: shadows.propertyCardHover,
          transform: 'translateY(-3px)',
        },
      }}
    >
      <Box
        component={Link}
        href={brokerCardProps.href}
        aria-label={`Ver página pública de ${brokerCardProps.name}`}
        ref={profileLinkRef}
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          borderRadius: `${radius.sm}px`,
          pointerEvents: 'none',
          textDecoration: 'none',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 3,
          },
        }}
      />

      <CardContent
        sx={{
          display: isListView ? 'grid' : 'block',
          gridTemplateColumns: {
            lg: isListView ? 'minmax(0, 1fr) minmax(430px, 0.72fr)' : '1fr',
          },
          gap: { xs: 2, lg: 2.4 },
          p: { xs: 2, md: isListView ? 2.6 : 2.4 },
          position: 'relative',
          zIndex: 2,
          '& a': {
            position: 'relative',
            zIndex: 4,
          },
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

          <DirectoryCardMetrics
            gridTemplateColumns={{ xs: '1fr', sm: '2fr 0.85fr 0.85fr' }}
            labelFontWeight={800}
            metrics={[
              { label: 'Região', value: brokerCardProps.region, showTooltip: true },
              { label: 'Imóveis', value: `${brokerCardProps.activeListings} ativos` },
              { label: 'Resposta', value: brokerCardProps.responseTime },
            ]}
            valueFontWeight={900}
          />
        </Box>

        {isListView ? (
          <ProfileListingPreviewSection
            accentColor="primary.main"
            backgroundColor={surface.app}
            hoverBorderColor="primary.main"
            listings={highlightedListings}
          />
        ) : null}

        <Box sx={{ gridColumn: '1 / -1' }}>
          <Divider sx={{ my: isListView ? 1.6 : 1.8 }} />

          <Stack
            component="span"
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
