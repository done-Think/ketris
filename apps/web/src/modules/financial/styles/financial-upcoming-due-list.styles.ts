import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  card: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    p: { xs: 2, md: 2.4 },
  },
  title: { color: brand.graphite[500], fontSize: 18, fontWeight: 900, mb: 1.8 },
  empty: { color: brand.neutral[500], fontSize: 13 },
  item: {
    bgcolor: surface.app,
    borderRadius: `${radius.sm}px`,
    display: 'grid',
    gridTemplateColumns: {
      xs: 'auto minmax(0, 1fr) auto',
      sm: 'minmax(0, 1fr) 92px 48px 76px',
    },
    gridTemplateAreas: {
      xs: '"text text text" "amount date status"',
      sm: '"text amount date status"',
    },
    alignItems: 'center',
    columnGap: 1.2,
    rowGap: { xs: 0.6, sm: 0 },
    justifyItems: 'stretch',
    px: 1.2,
    py: 1,
    textAlign: 'left',
    transition: motion.transition.bordered,
    width: '100%',
    '&:hover': {
      bgcolor: alpha.magenta[6],
    },
    '&:focus-visible': {
      boxShadow: `0 0 0 2px ${alpha.magenta[14]}`,
      outline: 0,
    },
  },
  itemText: { gridArea: 'text', minWidth: 0 },
  property: {
    color: brand.graphite[500],
    display: 'block',
    fontSize: 12,
    fontWeight: 900,
  },
  client: { color: brand.neutral[500], display: 'block', fontSize: 11 },
  amount: {
    color: brand.graphite[500],
    fontSize: 12,
    fontWeight: 900,
    gridArea: 'amount',
    justifySelf: { xs: 'start', sm: 'end' },
  },
  dueDate: {
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 700,
    gridArea: 'date',
    justifySelf: { xs: 'start', sm: 'center' },
  },
  status: { gridArea: 'status', justifySelf: 'end' },
} satisfies Record<string, SxProps<Theme>>
