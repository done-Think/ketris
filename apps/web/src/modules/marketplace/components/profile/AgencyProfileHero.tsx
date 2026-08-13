'use client'

import { Box, Chip, Stack, Typography } from '@mui/material'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import type { AgencyProfileHeroProps } from '../../types/profile'
import { AgencyBrandBanner } from '../AgencyBrandBanner'

export function AgencyProfileHero({ agency }: AgencyProfileHeroProps) {
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
      <Box sx={{ bgcolor: agency.brand.backgroundColor, p: { xs: 2, md: 3 } }}>
        <AgencyBrandBanner agency={agency} size="hero" />
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.3 }}>
          {agency.segments.map((segment) => (
            <Chip
              key={segment}
              label={segment}
              size="small"
              sx={{
                borderRadius: `${radius.sm}px`,
                bgcolor: alpha.graphite[6],
                color: agency.brand.primaryColor,
                fontWeight: 700,
              }}
            />
          ))}
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
          {agency.name}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 600, mb: 2 }}>
          {agency.legalCreci} / {agency.headquarters}
        </Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 860 }}>{agency.summary}</Typography>
      </Box>
    </Box>
  )
}
