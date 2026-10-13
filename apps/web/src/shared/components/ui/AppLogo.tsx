'use client'

import { Box } from '@mui/material'

import { Link } from '@/i18n/navigation'
import type { AppLogoProps } from '@shared/types/app-logo'

export function AppLogo({ src, variant = 'solid', width, marginBottom, sx }: AppLogoProps) {
  const resolvedSrc = typeof src === 'string' ? src : src.src

  return (
    <Box
      component={Link}
      href="/"
      aria-label="Ketris"
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          width,
          mb: marginBottom,
          height: variant === 'transparent' ? 30 : undefined,
          textDecoration: 'none',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="img"
        src={resolvedSrc}
        alt="Ketris"
        sx={{
          display: 'block',
          width: '100%',
          height: 'auto',
        }}
      />
    </Box>
  )
}
