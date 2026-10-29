import type { SxProps, Theme } from '@mui/material'
import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.md}px`,
    boxShadow: shadows.propertyCard,
    px: { xs: 2.2, md: 3.2 },
    py: { xs: 2.4, md: 3.2 },
  },
  typography: { fontSize: 24, fontWeight: 900, mb: 2.6 },
} satisfies Record<string, SxProps<Theme>>
