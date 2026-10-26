import type { SxProps, Theme } from '@mui/material'
import { brand, surface } from '@shared/theme/tokens'
import { leadsTableColumnWidthsSx as columnWidthsSx } from './table-columns.styles'

export const tableContainerSx: SxProps<Theme> = { overflowX: 'auto' }

export const tableSx: SxProps<Theme> = {
  ...columnWidthsSx,
  minWidth: 1100,
  tableLayout: 'fixed',
  '& .MuiTableCell-root': { borderBottom: 0, overflow: 'hidden' },
  '& .MuiTableHead-root .MuiTableCell-root': {
    px: 1.5,
    py: 0,
    color: brand.neutral[500],
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
    textAlign: 'left',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(3), & .MuiTableHead-root .MuiTableCell-root:nth-of-type(4), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)':
    {
      textAlign: 'center',
    },
  '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)':
    {
      textAlign: 'center',
    },
  '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3) .MuiTableSortLabel-root, & .MuiTableHead-root .MuiTableCell-root:nth-of-type(4) .MuiTableSortLabel-root, & .MuiTableHead-root .MuiTableCell-root:nth-of-type(6) .MuiTableSortLabel-root':
    {
      justifyContent: 'center',
      width: '100%',
    },
  '& .MuiTableSortLabel-root': {
    color: 'inherit',
    font: 'inherit',
    textTransform: 'inherit',
  },
  '& .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.Mui-active': {
    color: brand.neutral[500],
  },
  '& .MuiTableSortLabel-icon': {
    color: `${brand.neutral[500]} !important`,
  },
  '& .MuiTableBody-root .MuiTableCell-root': {
    px: 1.5,
    py: 0,
    color: brand.graphite[500],
    fontSize: 15.5,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  },
}

export const tableRowSx: SxProps<Theme> = { height: 44, bgcolor: surface.app }

export const stackSx: SxProps<Theme> = { minWidth: 0 }

export const typographySx: SxProps<Theme> = { minWidth: 0, fontSize: 16, fontWeight: 650 }

export const typographySx2: SxProps<Theme> = { color: 'text.secondary', fontSize: 15.5 }

export const typographySx3: SxProps<Theme> = { fontSize: 15.5, fontWeight: 800 }

export const buttonSx: SxProps<Theme> = { minWidth: 0, px: 0.6, fontSize: 15.5, fontWeight: 800 }

import { alpha } from '@shared/theme/tokens'

export function getTableRowSx(index: number): SxProps<Theme> {
  return {
    height: 58,
    bgcolor: index % 2 === 1 ? surface.app : surface.paper,
    transition: 'background-color 160ms ease',
    '&:hover': { bgcolor: alpha.graphite[6] },
  }
}
