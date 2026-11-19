import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'

export const styles = {
  stack: { minHeight: '60vh' } satisfies SxProps<Theme>,
  box: { width: '100%', p: 3.5 } satisfies SxProps<Theme>,
  box2: { width: '100%' } satisfies SxProps<Theme>,
  stack2: { mb: 2, color: brand.neutral[500], fontSize: 13 } satisfies SxProps<Theme>,
  typography: { fontSize: 13 } satisfies SxProps<Theme>,
  muiLink: { fontSize: 13 } satisfies SxProps<Theme>,
  typography2: { fontSize: 13 } satisfies SxProps<Theme>,
  typography3: {
    color: brand.magenta[500],
    fontSize: 13,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  stack3: { minHeight: { lg: 'calc(100vh - 210px)' } } satisfies SxProps<Theme>,
  stack4: { flex: 1.25, minWidth: 0 } satisfies SxProps<Theme>,
  contractDetailPanel: { flex: 1 } satisfies SxProps<Theme>,
  typography4: {
    color: brand.neutral[500],
    fontSize: 15,
    lineHeight: 1.8,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
  stack5: { flex: 1, minWidth: 0 } satisfies SxProps<Theme>,
  landlordAlert: { mb: 3 } satisfies SxProps<Theme>,
  alerts: { mb: 3 } satisfies SxProps<Theme>,
  paymentSummary: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr)',
      sm: 'repeat(2, minmax(0, 1fr))',
      lg: 'repeat(4, minmax(0, 1fr))',
    },
    gap: { xs: 1.4, md: 1.8 },
  } satisfies SxProps<Theme>,
  documents: { maxWidth: 760 } satisfies SxProps<Theme>,
}
