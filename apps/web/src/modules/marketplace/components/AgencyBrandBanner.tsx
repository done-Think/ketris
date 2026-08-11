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
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 1.2 : { xs: 1.6, md: 2.8 },
        px: compact ? 1.2 : { xs: 1.8, md: 3 },
        py: compact ? 0.8 : 2,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'relative',
          width: compact ? 44 : { xs: 66, md: 92 },
          height: compact ? 46 : { xs: 76, md: 108 },
          flex: '0 0 auto',
          ml: compact ? 0.2 : 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: compact ? 8 : { xs: 11, md: 15 },
            top: compact ? 5 : { xs: 8, md: 12 },
            width: compact ? 29 : { xs: 44, md: 60 },
            height: compact ? 29 : { xs: 44, md: 60 },
            borderLeft: `${compact ? 7 : 11}px solid ${agency.brand.primaryColor}`,
            borderTop: `${compact ? 7 : 11}px solid ${agency.brand.primaryColor}`,
            transform: 'rotate(-45deg)',
            transformOrigin: 'center',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            right: compact ? 2 : { xs: 0, md: 2 },
            top: compact ? 13 : { xs: 22, md: 31 },
            width: compact ? 25 : { xs: 38, md: 50 },
            height: compact ? 14 : { xs: 22, md: 28 },
            bgcolor: agency.brand.primaryColor,
            transform: 'skewX(35deg)',
            opacity: 0.96,
          },
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
          flex: '1 1 auto',
          minWidth: 0,
          pr: compact ? 0.8 : 1.4,
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
            fontSize: compact ? 20 : { xs: 34, md: 54 },
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
