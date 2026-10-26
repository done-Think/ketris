import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  paper: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.propertyCard,
  },
  container: { overflowX: 'auto' },
  table: {
    width: '100%',
    minWidth: 840,
    '& .MuiTableCell-root': { borderColor: 'divider' },
    '& .MuiTableHead-root .MuiTableCell-root': {
      px: 1.5,
      py: 0,
      color: brand.neutral[500],
      fontSize: 14,
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '0.01em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    },
    '& .MuiTableHead-root .MuiTableCell-root:last-of-type': { textAlign: 'center' },
    '& .MuiTableBody-root .MuiTableCell-root': { px: 1.5, py: 0, fontSize: 15.5, lineHeight: 1.3 },
  },
  headRow: { height: 44, bgcolor: surface.app },
  empty: { py: 4, color: 'text.secondary', textAlign: 'center' },
} satisfies Record<string, SxProps<Theme>>
