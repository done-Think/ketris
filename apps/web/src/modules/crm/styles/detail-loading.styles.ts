import type { SxProps, Theme } from '@mui/material'

export const boxSx: SxProps<Theme> = { p: { xs: 2, md: 3.5 } }

export const stackSx: SxProps<Theme> = { mt: 1, mb: 3 }

export const boxSx2: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 58fr) minmax(320px, 42fr)' },
  gap: 2,
}
