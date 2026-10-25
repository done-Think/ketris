import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  panel: {
    p: { xs: 2, md: 3 },
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.md}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.crmListPanel,
  },
  box: {
    width: '100%',
    maxWidth: 920,
    mx: 'auto',
    p: { xs: 2, md: 3.5 },
    pt: { xs: 10, md: 3.5 },
  },
  typography: { color: brand.graphite[500], fontWeight: 900 },
  typography2: { color: brand.neutral[500], mt: 0.5 },
  typography3: { fontWeight: 800 },
  avatar: { width: 72, height: 72, bgcolor: 'primary.main' },
  typography4: { fontWeight: 800 },
  typography5: { color: brand.neutral[500] },
} satisfies Record<string, SxProps<Theme>>
