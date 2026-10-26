import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import type { ContractStatusStyle } from '../types/contract'

export const styles = {
  stack: { minWidth: 0, height: '100%' } satisfies SxProps<Theme>,
  box: {
    width: 56,
    height: 56,
    borderRadius: `${radius.sm}px`,
    objectFit: 'cover',
    flexShrink: 0,
  } satisfies SxProps<Theme>,
  stack2: { minWidth: 0 } satisfies SxProps<Theme>,
  typography: {
    color: brand.graphite[500],
    fontSize: 15,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  typography2: {
    color: brand.neutral[500],
    fontSize: 13,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
  chip: (statusStyle: ContractStatusStyle): SxProps<Theme> => ({
    height: 30,
    borderRadius: `${radius.full}px`,
    bgcolor: statusStyle.bgcolor,
    color: statusStyle.color,
    fontSize: 13,
    fontWeight: 900,
  }),
  stack3: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    transform: 'translateX(-40px)',
  } satisfies SxProps<Theme>,
  moreHorizRoundedIcon: { fontSize: iconSize.md } satisfies SxProps<Theme>,
  divider: { borderColor: alpha.graphite[8] } satisfies SxProps<Theme>,
  menuItem: { minHeight: 48, gap: 1.2 } satisfies SxProps<Theme>,
  listItemIcon: { minWidth: 32, color: brand.neutral[500] } satisfies SxProps<Theme>,
  optionIcon: { fontSize: iconSize.sm } satisfies SxProps<Theme>,
  box2: {
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.crmCardCompact,
    width: '100%',
    minWidth: 0,
  } satisfies SxProps<Theme>,
  dataGrid: {
    border: 0,
    minHeight: 400,
    color: brand.graphite[500],
    '& .MuiDataGrid-columnHeaders': {
      bgcolor: surface.app,
      color: brand.neutral[500],
      fontSize: 12,
      fontWeight: 900,
      textTransform: 'uppercase',
    },
    '& .MuiDataGrid-cell': {
      borderColor: brand.neutral[100],
      outline: 'none',
    },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
      outline: 'none',
    },
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
      outline: 'none',
    },
    '& .contracts-actions-column .MuiDataGrid-columnHeaderTitleContainer': {
      transform: 'translateX(-40px)',
    },
    '& .MuiDataGrid-row': {
      bgcolor: surface.paper,
      cursor: 'pointer',
    },
    '& .MuiDataGrid-row:nth-of-type(even)': {
      bgcolor: surface.app,
    },
    '& .MuiDataGrid-row:hover': {
      bgcolor: alpha.magenta[6],
    },
    '& .MuiDataGrid-footerContainer': {
      borderColor: brand.neutral[100],
    },
  } satisfies SxProps<Theme>,
}

export const contractIconButtonSx = {
  width: 38,
  height: 38,
  borderRadius: `${radius.sm}px`,
  color: brand.graphite[500],
  bgcolor: brand.neutral[50],
  '&:hover': {
    color: brand.magenta[500],
    bgcolor: alpha.magenta[8],
  },
} as const

export const contractMenuSlotProps = {
  paper: {
    sx: {
      mt: 0.8,
      minWidth: 220,
      borderRadius: `${radius.sm}px`,
      border: '1px solid',
      borderColor: alpha.graphite[8],
      boxShadow: shadows.popover,
    },
  },
} as const

export const contractMenuTextProps = { fontSize: 16, fontWeight: 800 } as const
