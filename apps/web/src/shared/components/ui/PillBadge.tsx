import { Box } from '@mui/material'
import type { ReactNode } from 'react'

import { alpha, componentText, radius, surface } from '@shared/theme/tokens'

type PillBadgeProps = {
  children: ReactNode
}

export function PillBadge({ children }: PillBadgeProps) {
  return (
    <Box
      sx={{
        minHeight: 26,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: radius.full,
        boxShadow: `0 4px 12px ${alpha.graphite[16]}`,
        color: 'text.primary',
        fontFamily: 'inherit',
        px: 1.15,
        py: 0,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        ...componentText.cardTitle,
        fontSize: 13,
        lineHeight: 1.25,
      }}
    >
      {children}
    </Box>
  )
}
