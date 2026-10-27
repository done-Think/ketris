import type { SxProps, Theme } from '@mui/material'

import { componentText, surface } from '@shared/theme/tokens'

export const styles = {
  section: {
    bgcolor: surface.paper,
    borderTop: '1px solid',
    borderColor: 'divider',
    py: { xs: 4, md: 5 },
  },
  eyebrow: { color: 'text.secondary', ...componentText.miniSectionEyebrow, mb: 3 },
  grid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, minmax(0, 1fr))',
      sm: 'repeat(3, minmax(0, 1fr))',
      md: 'repeat(6, minmax(0, 1fr))',
    },
    gap: { xs: 1.2, md: 2 },
    maxWidth: 1020,
    mx: 'auto',
  },
} satisfies Record<string, SxProps<Theme>>
