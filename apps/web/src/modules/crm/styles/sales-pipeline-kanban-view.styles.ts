import type { SxProps, Theme } from '@mui/material'

export const boxSx: SxProps<Theme> = {
  mt: { xs: 2.25, lg: 1.5 },
  mx: { xs: -2, sm: -3, lg: -3.5 },
  pl: { xs: 2, sm: 3, lg: 3.5 },
  pr: { xs: 2, sm: 3, lg: 1.75 },
  pb: { xs: 1, md: 0.25 },
  display: { md: 'flex' },
  flex: { md: 1 },
  minHeight: { md: 0 },
  overflowX: 'auto',
  scrollSnapType: { xs: 'x proximity', lg: 'none' },
  scrollbarWidth: 'thin',
}

export const boxSx2: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(5, 264px)',
    sm: 'repeat(5, 280px)',
    lg: 'repeat(5, minmax(0, 1fr))',
  },
  gridTemplateRows: { md: 'minmax(0, 1fr)' },
  gap: { xs: 2, lg: 1.75 },
  flex: { md: 1 },
  minWidth: { xs: 'max-content', lg: 0 },
}
