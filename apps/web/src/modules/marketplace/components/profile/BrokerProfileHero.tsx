'use client'

import { Avatar, Box, Typography } from '@mui/material'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { defaultBrokerHeadline, defaultProfileCoverImage } from '../../config/profile-defaults'
import type { BrokerProfileHeroProps } from '../../types/broker'

export function BrokerProfileHero({ broker }: BrokerProfileHeroProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        boxShadow: shadows.propertyCard,
        overflow: 'hidden',
        mb: 2.5,
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 170, md: 260 },
          backgroundImage: `linear-gradient(90deg, ${brand.graphite[900]}, ${alpha.graphite[18]}), url("${broker.bannerUrl ?? defaultProfileCoverImage}")`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          display: 'grid',
          alignItems: 'end',
          p: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ maxWidth: 720 }}>
          <Typography
            sx={{
              color: surface.lightText,
              fontSize: { xs: 22, md: 34 },
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: 0,
            }}
          >
            {broker.headline ?? defaultBrokerHeadline}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'auto minmax(0, 1fr)' },
          gap: { xs: 2, md: 2.5 },
          alignItems: 'center',
          bgcolor: broker.backgroundColor ?? surface.app,
          p: { xs: 2, md: 3 },
        }}
      >
        <Avatar
          src={broker.avatar ?? undefined}
          alt={broker.name}
          sx={{
            width: { xs: 86, md: 118 },
            height: { xs: 86, md: 118 },
            boxShadow: `0 0 0 5px ${surface.paper}`,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              color: surface.darkText,
              fontSize: { xs: 28, md: 42 },
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: 0,
              mb: 1,
            }}
          >
            {broker.name}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 500 }}>
            {[broker.creci, broker.region].filter(Boolean).join(' / ')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography sx={{ color: 'text.secondary', maxWidth: 760 }}>{broker.bio}</Typography>
      </Box>
    </Box>
  )
}
