import { Box } from '@mui/material'
import type { ReactNode } from 'react'

import { componentText, radius, surface } from '@shared/theme/tokens'

type PillBadgeProps = {
  children: ReactNode
}

export function PillBadge({ children }: PillBadgeProps) {
  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        borderRadius: radius.full,
        px: 1.2,
        py: 0.4,
        color: 'text.primary',
        ...componentText.badge,
      }}
    >
      {children}
    </Box>
  )
}
