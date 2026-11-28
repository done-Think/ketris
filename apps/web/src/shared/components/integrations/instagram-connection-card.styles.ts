import type { SxProps, Theme } from '@mui/material'
import { alpha, radius, surface } from '@shared/theme/tokens'

export const styles = {
  root: {
    p: 2,
    mb: 2,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  },
  title: { fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>
