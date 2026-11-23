import type { SxProps, Theme } from '@mui/material'

import { radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 1.5,
    px: 3,
    py: { xs: 5, md: 7 },
    borderRadius: `${radius.lg}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.crmListPanel,
  },
  emptyText: { color: 'text.secondary', maxWidth: 440 },
} satisfies Record<string, SxProps<Theme>>
