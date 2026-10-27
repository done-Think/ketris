import type { SxProps, Theme } from '@mui/material'

import { alpha } from '@shared/theme/tokens'

export const styles = {
  panel: { p: { xs: 2, md: 2.4 } },
  description: { mb: 1.2 },
  list: { listStyle: 'none', m: 0, p: 0 },
  item: {
    alignItems: { xs: 'stretch', sm: 'center' },
    justifyContent: 'space-between',
    py: 1.2,
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
    '&:last-of-type': { borderBottom: 0 },
  },
  identity: { minWidth: 0 },
  chips: { mt: 0.6 },
} satisfies Record<string, SxProps<Theme>>
