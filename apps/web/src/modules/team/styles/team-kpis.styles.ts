import type { SxProps, Theme } from '@mui/material'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
    gap: 1.4,
  },
  card: {
    p: { xs: 1.5, md: 1.8 },
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.crmListPanel,
  },
  label: { color: brand.neutral[500], fontSize: 11.5, fontWeight: 800 },
  value: { color: brand.graphite[500], fontSize: 24, fontWeight: 900 },
  helper: { color: brand.neutral[500], fontSize: 11.5 },
} satisfies Record<string, SxProps<Theme>>
