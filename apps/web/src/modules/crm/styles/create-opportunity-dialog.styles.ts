import type { SxProps, Theme } from '@mui/material'

export const dialogTitleSx: SxProps<Theme> = { letterSpacing: 0 }

export const boxSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  gap: 2,
  pt: 1,
}

export const boxSx2: SxProps<Theme> = { gridColumn: { sm: '1 / -1' } }
