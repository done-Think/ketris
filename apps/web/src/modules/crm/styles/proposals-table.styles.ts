import type { SxProps, Theme } from '@mui/material'
import { brand, surface } from '@shared/theme/tokens'

export const tableContainerSx: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
  overflowX: 'auto',
}

export const tableSx: SxProps<Theme> = {
  minWidth: 780,
  tableLayout: 'fixed',
  '& .MuiTableCell-root': { borderColor: 'divider' },
  '& .MuiTableHead-root .MuiTableCell-root': {
    px: 1.25,
    py: 0,
    color: brand.neutral[500],
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  '& .MuiTableBody-root .MuiTableCell-root': {
    px: 1.25,
    py: 0,
    color: brand.graphite[500],
    fontSize: 15.5,
    lineHeight: 1.3,
  },
  '& .MuiTableHead-root .MuiTableCell-root:last-of-type, & .MuiTableBody-root .MuiTableCell-root:last-of-type':
    {
      px: 0.75,
    },
}

export const tableRowSx: SxProps<Theme> = { height: 44, bgcolor: surface.app }

export const boxSx: SxProps<Theme> = { display: 'inline-block', transform: 'translateX(-45px)' }

export const overflowTooltipTextSx: SxProps<Theme> = { fontSize: 15.5, fontWeight: 800 }

export const overflowTooltipTextSx2: SxProps<Theme> = { fontSize: 15.5, fontWeight: 600 }

export const overflowTooltipTextSx3: SxProps<Theme> = { color: 'text.disabled', fontSize: 14 }

export const boxSx2: SxProps<Theme> = { transform: 'translateX(-10px)' }

export const overflowTooltipTextSx4: SxProps<Theme> = { color: 'text.secondary', fontSize: 15.5 }

export const boxSx3: SxProps<Theme> = { transform: 'translateX(-30px)' }

import { alpha } from '@shared/theme/tokens'

export function getBoxSx(width: string): SxProps<Theme> {
  return { width }
}

export function getTableRowSx(index: number): SxProps<Theme> {
  return {
    height: 58,
    bgcolor: index % 2 === 1 ? surface.app : surface.paper,
    transition: 'background-color 160ms ease',
    '&:hover': { bgcolor: alpha.graphite[6] },
  }
}
