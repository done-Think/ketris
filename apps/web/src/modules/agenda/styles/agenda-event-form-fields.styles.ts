import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: { pt: 1 } satisfies SxProps<Theme>,
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    gap: 1.4,
  } satisfies SxProps<Theme>,
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
    gap: 1.4,
  } satisfies SxProps<Theme>,
}
