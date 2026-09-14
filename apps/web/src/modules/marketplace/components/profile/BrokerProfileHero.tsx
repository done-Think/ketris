'use client'

import { Avatar, Box, Chip, Stack, Typography } from '@mui/material'
import StarRoundedIcon from '@mui/icons-material/StarRounded'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { BrokerProfileHeroProps } from '../../types/broker'
import { formatRating } from '../../utils/format-rating'

export function BrokerProfileHero({ broker, theme }: BrokerProfileHeroProps) {
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
          backgroundImage: `linear-gradient(90deg, ${brand.graphite[900]}, ${alpha.graphite[18]}), url("${theme.cover}")`,
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
            {theme.signature}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'auto minmax(0, 1fr)' },
          gap: { xs: 2, md: 2.5 },
          alignItems: 'center',
          bgcolor: theme.tone,
          p: { xs: 2, md: 3 },
        }}
      >
        <Avatar
          src={broker.avatar}
          alt={broker.name}
          sx={{
            width: { xs: 86, md: 118 },
            height: { xs: 86, md: 118 },
            boxShadow: `0 0 0 5px ${surface.paper}`,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
            <Chip
              label={theme.label}
              size="small"
              sx={{
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                color: theme.accent,
                fontWeight: 700,
              }}
            />
            <Chip
              icon={<StarRoundedIcon sx={{ fontSize: iconSize.xs }} />}
              label={formatRating(broker.rating)}
              size="small"
              sx={{
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                fontWeight: 700,
              }}
            />
          </Stack>
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
            {broker.creci} / {broker.region}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' },
            gap: { xs: 2, md: 3 },
            alignItems: 'start',
          }}
        >
          <Box>
            <Typography sx={{ color: 'text.secondary', maxWidth: 760, mb: 2 }}>
              {broker.bio}
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 760, fontWeight: 500 }}>
              {theme.summary}
            </Typography>
          </Box>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.app,
              p: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1.2 }}>
              Modo de trabalho
            </Typography>
            <Stack spacing={0.8}>
              {theme.method.map((item) => (
                <Stack key={item} direction="row" spacing={0.8} alignItems="center">
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: radius.full,
                      bgcolor: theme.accent,
                      flex: '0 0 auto',
                    }}
                  />
                  <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
