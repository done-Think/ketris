'use client'

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { DashboardTablePagination } from '@shared/components/layout'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'
import type { MaintenanceTicketsTableProps } from '../types/maintenance-dashboard'
import { statusStyles, priorityColors } from '../utils/maintenance-presentation'

export function MaintenanceTicketsTable({
  pagedTickets,
  totalCount,
  currentPage,
  rowsPerPage,
  setCurrentPage,
  onRowsPerPageChange,
  onOpenMenu,
}: MaintenanceTicketsTableProps) {
  const t = useTranslations('dashboard.maintenance')
  return (
    <TableContainer
      sx={{
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        boxShadow: shadows.crmCardCompact,
        overflowX: 'auto',
      }}
    >
      <Table size="small" sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            {[
              'ticket',
              'property',
              'category',
              'priority',
              'tenant',
              'openedAt',
              'status',
              'actions',
            ].map((column) => (
              <TableCell
                key={column}
                align={column === 'actions' ? 'center' : undefined}
                sx={headerCellSx}
              >
                {t(`columns.${column}`)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {pagedTickets.map((ticket, index) => (
            <TableRow
              key={ticket.id}
              sx={{
                bgcolor: index % 2 === 1 ? surface.app : surface.paper,
                transition: 'background-color 160ms ease',
                '&:hover': { bgcolor: alpha.graphite[6] },
                '&:last-child td': { borderBottom: 0 },
              }}
            >
              <TableCell sx={{ ...bodyCellSx, color: 'primary.main', fontWeight: 900 }}>
                {ticket.id}
              </TableCell>
              <TableCell sx={{ ...bodyCellSx, fontWeight: 900 }}>{ticket.property}</TableCell>
              <TableCell sx={bodyCellSx}>{ticket.category}</TableCell>
              <TableCell sx={bodyCellSx}>
                <Stack direction="row" spacing={0.65} alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: priorityColors[ticket.priority],
                    }}
                  />
                  <span>{t(`priorities.${ticket.priority}`)}</span>
                </Stack>
              </TableCell>
              <TableCell sx={bodyCellSx}>{ticket.tenant}</TableCell>
              <TableCell sx={{ ...bodyCellSx, color: brand.neutral[400] }}>
                {ticket.openedAt}
              </TableCell>
              <TableCell sx={bodyCellSx}>
                <Chip
                  label={t(`statuses.${ticket.status}`)}
                  size="small"
                  sx={{
                    height: 22,
                    bgcolor: statusStyles[ticket.status].bgcolor,
                    color: statusStyles[ticket.status].color,
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                />
              </TableCell>
              <TableCell sx={bodyCellSx} align="center">
                <Stack direction="row" spacing={0.4} justifyContent="center">
                  <IconButton
                    component={Link}
                    href={{
                      pathname: '/dashboard/maintenance/[id]',
                      params: { id: ticket.id },
                    }}
                    aria-label={t('viewTicket', { ticket: ticket.id })}
                    size="small"
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: `${radius.sm}px`,
                      bgcolor: surface.app,
                      color: brand.graphite[500],
                    }}
                  >
                    <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  {(ticket.permissions?.edit || ticket.permissions?.delete) && (
                    <IconButton
                      aria-label={t('actions.menu', { ticket: ticket.id })}
                      size="small"
                      onClick={(event) => {
                        onOpenMenu(event.currentTarget, ticket.id)
                      }}
                      sx={{ width: 30, height: 30, color: brand.graphite[500] }}
                    >
                      <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {pagedTickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={bodyCellSx}>
                {t('empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DashboardTablePagination
        count={totalCount}
        page={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(nextRowsPerPage) => {
          onRowsPerPageChange(nextRowsPerPage)
        }}
      />
    </TableContainer>
  )
}
const headerCellSx = {
  height: 40,
  px: 1.75,
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
const bodyCellSx = {
  height: 54,
  px: 1.75,
  py: 0.8,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const
