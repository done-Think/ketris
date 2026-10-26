import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'
import { priorityColors, statusStyles } from './maintenance-presentation.styles'

export const headerCellSx = {
  height: 40,
  px: 1.25,
  py: 0.8,
  bgcolor: surface.app,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '.07em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
} as const

export const bodyCellSx = {
  height: 54,
  px: 1.25,
  py: 0.8,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const

export const truncatedCellSx = (maxWidth: number) =>
  ({ maxWidth, overflow: 'hidden', textOverflow: 'ellipsis' }) as const

export const tableContainerSx: SxProps<Theme> = {
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
  boxShadow: shadows.crmCardCompact,
  overflowX: 'auto',
}

export const tableSx: SxProps<Theme> = { minWidth: 800 }

export const iconButtonSx: SxProps<Theme> = {
  width: 30,
  height: 30,
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.app,
  color: brand.graphite[500],
}

export const visibilityOutlinedIconSx: SxProps<Theme> = { fontSize: 16 }

export const iconButtonSx2: SxProps<Theme> = { width: 30, height: 30, color: brand.graphite[500] }

export const moreVertRoundedIconSx: SxProps<Theme> = { fontSize: 18 }

export function getTableRowSx(index: number): SxProps<Theme> {
  return {
    bgcolor: index % 2 === 1 ? surface.app : surface.paper,
    transition: 'background-color 160ms ease',
    '&:hover': { bgcolor: alpha.graphite[6] },
    '&:last-child td': { borderBottom: 0 },
  }
}

export function extraStyleSx1(
  ticket: import('../types/maintenance').MaintenanceTicket,
): SxProps<Theme> {
  return {
    width: 6,
    height: 6,
    borderRadius: '50%',
    bgcolor: priorityColors[ticket.priority],
  }
}

export function extraStyleSx2(
  ticket: import('../types/maintenance').MaintenanceTicket,
): SxProps<Theme> {
  return {
    height: 22,
    bgcolor: statusStyles[ticket.status].bgcolor,
    color: statusStyles[ticket.status].color,
    fontSize: 11,
    fontWeight: 900,
  }
}

export const extraStyleSx3: SxProps<Theme> = {
  ...bodyCellSx,
  ...truncatedCellSx(110),
  color: 'primary.main',
  fontWeight: 900,
}

export const extraStyleSx4: SxProps<Theme> = {
  ...bodyCellSx,
  ...truncatedCellSx(200),
  fontWeight: 900,
}

export const extraStyleSx5: SxProps<Theme> = { ...bodyCellSx, ...truncatedCellSx(160) }

export const extraStyleSx6: SxProps<Theme> = { ...bodyCellSx, color: brand.neutral[400] }
