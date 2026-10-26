import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  box: (sx: SxProps<Theme> | undefined): SxProps<Theme> => ({
    display: 'flex',
    flexDirection: 'column',
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.crmCardCompact,
    p: { xs: 2, md: 3 },
    ...sx,
  }),
  typography: {
    mb: 2.8,
    color: brand.graphite[500],
    fontSize: 18,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
}
