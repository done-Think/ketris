import { Box, Typography } from '@mui/material'

import { alpha, radius } from '@shared/theme/tokens'

import type { AgencyBrandBannerProps } from '../types/agency'

export function AgencyBrandBanner({ agency, size }: AgencyBrandBannerProps) {
  const compact = size === 'compact'

  return (
    <Box
      aria-label={`${agency.name}, ${agency.legalCreci}`}
      sx={{
        width: '100%',
        minWidth: 0,
        height: compact ? 74 : { xs: 150, md: 190 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${radius.sm}px`,
        bgcolor: agency.brand.backgroundColor,
        color: agency.brand.secondaryColor,
        overflow: 'hidden',
        position: 'relative',
        display: 'grid',
        alignItems: 'center',
        px: compact ? 1.2 : { xs: 1.8, md: 3 },
        py: compact ? 0.8 : 2,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          left: compact ? 12 : { xs: 18, md: 28 },
          top: compact ? 10 : { xs: 22, md: 30 },
          width: compact ? 52 : { xs: 88, md: 130 },
          height: compact ? 36 : { xs: 58, md: 82 },
          borderLeft: `${compact ? 7 : 12}px solid ${agency.brand.primaryColor}`,
          borderTop: `${compact ? 7 : 12}px solid ${agency.brand.primaryColor}`,
          transform: 'skewX(-8deg) rotate(-45deg)',
          transformOrigin: 'left top',
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          left: compact ? 42 : { xs: 68, md: 104 },
          top: compact ? 9 : { xs: 20, md: 28 },
          width: compact ? 54 : { xs: 96, md: 142 },
          height: compact ? 24 : { xs: 42, md: 58 },
          bgcolor: agency.brand.primaryColor,
          transform: 'skewX(35deg)',
          opacity: 0.95,
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          left: compact ? 12 : { xs: 18, md: 28 },
          right: compact ? 12 : { xs: 18, md: 28 },
          bottom: compact ? 8 : { xs: 16, md: 22 },
          height: compact ? 3 : 6,
          bgcolor: agency.brand.primaryColor,
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          pl: compact ? 7.6 : { xs: 10.5, md: 16 },
          pr: compact ? 0.8 : 1.4,
          minWidth: 0,
        }}
      >
        <Typography
          noWrap
          sx={{
            color: agency.brand.secondaryColor,
            fontSize: compact ? 11 : { xs: 17, md: 23 },
            fontStyle: 'italic',
            fontWeight: 900,
            lineHeight: 1,
            textShadow: `0 1px 0 ${alpha.white[72]}`,
          }}
        >
          {agency.brand.eyebrow}
        </Typography>
        <Typography
          noWrap
          sx={{
            color: agency.brand.primaryColor,
            fontSize: compact ? 24 : { xs: 44, md: 64 },
            fontWeight: 900,
            lineHeight: 0.95,
          }}
        >
          {agency.brand.title}
        </Typography>
        <Typography
          noWrap
          sx={{
            color: agency.brand.secondaryColor,
            fontSize: compact ? 8.5 : { xs: 10, md: 12 },
            fontWeight: 800,
            textAlign: 'right',
            mt: compact ? 0.2 : 0.5,
          }}
        >
          {agency.legalCreci}
        </Typography>
      </Box>
    </Box>
  )
}
