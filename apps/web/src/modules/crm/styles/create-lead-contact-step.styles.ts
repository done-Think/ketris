import type { SxProps, Theme } from '@mui/material'

export const boxSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: 1.4,
}

export const rhfTextFieldSx: SxProps<Theme> = { gridColumn: { md: '1 / -1' } }
