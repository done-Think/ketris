import type { PropertyStatusStyle } from '../types/dashboard-property'
import { alpha, brand, radius, surface, iconSize, shadows } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: { minWidth: 0, height: '100%' },
  box: {
    width: 56,
    height: 56,
    borderRadius: `${radius.sm}px`,
    objectFit: 'cover',
    flexShrink: 0,
  },
  box2: { minWidth: 0 },
  typography: { fontSize: 15, fontWeight: 900 },
  typography2: { color: 'text.secondary', fontSize: 13 },
  box3: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack2: {
    minHeight: 220,
    px: 3,
    textAlign: 'center',
  },
  box4: {
    width: 48,
    height: 48,
    borderRadius: `${radius.full}px`,
    display: 'grid',
    placeItems: 'center',
    bgcolor: alpha.magenta[10],
    color: brand.magenta[500],
  },
  homeWorkOutlinedIcon: { fontSize: iconSize.lg },
  typography3: { fontSize: 16, fontWeight: 900, color: brand.graphite[500] },
  typography4: { mt: 0.5, color: brand.neutral[500], fontSize: 13 },
  addRoundedIcon: { fontSize: iconSize.sm },
  button: {
    mt: 0.5,
    borderRadius: `${radius.sm}px`,
    bgcolor: brand.magenta[500],
    px: 2.2,
    fontWeight: 900,
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': {
      bgcolor: brand.magenta[600],
      boxShadow: 'none',
    },
  },
  box5: {
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    border: '1px solid',
    borderColor: alpha.graphite[6],
    width: '100%',
    minWidth: 0,
  },
} satisfies Record<string, SxProps<Theme>>

export function getStatusChipStyles(status: PropertyStatusStyle): SxProps<Theme> {
  return {
    height: 30,
    borderRadius: `${radius.full}px`,
    bgcolor: status.bgcolor,
    color: status.color,
    fontSize: 13,
    fontWeight: 900,
  }
}

export function getGridStyles(emptyInventory: boolean): SxProps<Theme> {
  return {
    border: 0,
    minHeight: emptyInventory ? 360 : 'auto',
    overflow: 'hidden',
    borderRadius: `${radius.sm}px`,
    '& .MuiDataGrid-main': {
      overflow: 'hidden',
    },
    '& .MuiDataGrid-topContainer': {
      bgcolor: surface.paper,
    },
    '& .MuiDataGrid-columnHeaders': {
      bgcolor: surface.paper,
      color: brand.neutral[500],
      fontSize: 12,
      fontWeight: 900,
      textTransform: 'uppercase',
      borderBottom: '1px solid',
      borderColor: brand.neutral[100],
    },
    '& .MuiDataGrid-columnHeader': {
      px: 1.5,
    },
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
      outline: 'none',
    },
    '& .MuiDataGrid-columnSeparator': {
      display: 'none',
    },
    '& .properties-status-cell': {
      overflow: 'visible',
    },
    '& .MuiDataGrid-cell': {
      px: 1.5,
      borderTop: '1px solid',
      borderBottom: '1px solid',
      borderColor: alpha.graphite[8],
      outline: 'none',
    },
    '& .MuiDataGrid-cell[data-field="title"]': {
      borderLeft: 0,
    },
    '& .MuiDataGrid-cell[data-field="actions"]': {
      borderRight: 0,
    },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
      outline: 'none',
    },
    '& .MuiDataGrid-row': {
      cursor: 'pointer',
      borderRadius: 0,
    },
    '& .MuiDataGrid-row.properties-row-base': {
      bgcolor: surface.paper,
    },
    '& .MuiDataGrid-row.properties-row-alt': {
      bgcolor: surface.app,
    },
    '& .MuiDataGrid-row:hover': {
      bgcolor: `${alpha.graphite[6]} !important`,
    },
    '& .MuiDataGrid-footerContainer': {
      borderColor: brand.neutral[100],
    },
  }
}
