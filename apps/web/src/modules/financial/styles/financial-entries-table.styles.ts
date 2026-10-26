import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  amountCell: {
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    p: { xs: 1.6, md: 2.4 },
    width: '100%',
    minWidth: 0,
  },
  title: { color: brand.graphite[500], fontSize: 18, fontWeight: 900, mb: 1.8 },
  dataGrid: {
    border: 0,
    '& .MuiDataGrid-columnHeaders': {
      bgcolor: brand.neutral[50],
      color: brand.neutral[500],
      fontSize: 11,
      fontWeight: 900,
      textTransform: 'uppercase',
    },
    '& .MuiDataGrid-columnSeparator': {
      display: 'none',
    },
    '& .financial-status-header .MuiDataGrid-columnHeaderTitleContainer': {
      transform: 'translateX(20px)',
    },
    '& .MuiDataGrid-cell': {
      borderBottom: 0,
      color: brand.neutral[500],
      fontSize: 13,
      fontWeight: 700,
      outline: 'none !important',
    },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
      outline: 'none',
    },
    '& .MuiDataGrid-row': {
      borderBottom: '1px solid',
      borderColor: alpha.graphite[6],
      cursor: 'pointer',
      transition: motion.transition.bordered,
    },
    '& .MuiDataGrid-row:hover': {
      bgcolor: brand.neutral[50],
    },
  },
  statusCell: { transform: 'translateX(20px)' },
} satisfies Record<string, SxProps<Theme>>

export function getAmountStyles(value: number): SxProps<Theme> {
  return {
    color: value >= 0 ? brand.semantic.success : brand.semantic.error,
    fontSize: 13,
    fontWeight: 900,
    lineHeight: 1,
    textAlign: 'center',
  }
}
