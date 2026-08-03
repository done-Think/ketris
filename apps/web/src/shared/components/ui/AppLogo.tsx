import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import Link from 'next/link'

type AppLogoProps = {
  src: string
  width: { xs?: number; sm?: number; md?: number } | number
  marginBottom?: { xs?: number; md?: number } | number
  sx?: SxProps<Theme>
}

export function AppLogo({ src, width, marginBottom, sx }: AppLogoProps) {
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
          height: src.includes('transparent') ? 30 : undefined,
          textDecoration: 'none',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="img"
        src={src}
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
