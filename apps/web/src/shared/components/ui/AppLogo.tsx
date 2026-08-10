import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { StaticImageData } from 'next/image'
import Link from 'next/link'

type AppLogoProps = {
  src: string | StaticImageData
  variant?: 'solid' | 'transparent'
  width: { xs?: number; sm?: number; md?: number } | number
  marginBottom?: { xs?: number; md?: number } | number
  sx?: SxProps<Theme>
}

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
