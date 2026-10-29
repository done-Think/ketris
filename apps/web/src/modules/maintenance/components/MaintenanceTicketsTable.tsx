'use client'

import * as maintenanceStyles from '../styles/maintenance-tickets-table.styles'

import { formatMaintenanceCategory } from '../utils/maintenance-category'

import { Link } from '@/i18n/navigation'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
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
import { DashboardTablePagination } from '@shared/components/layout'
import { useTranslations } from 'next-intl'
import type { MaintenanceTicketsTableProps } from '../types/maintenance-dashboard'

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
    <TableContainer sx={maintenanceStyles.tableContainerSx}>
      <Table size="small" sx={maintenanceStyles.tableSx}>
        <TableHead>
          <TableRow>
            {(
              [
                'ticket',
                'property',
                'category',
                'priority',
                'tenant',
                'openedAt',
                'status',
                'actions',
              ] as const
            ).map((column) => (
              <TableCell
                key={column}
                align={column === 'actions' ? 'center' : undefined}
                sx={maintenanceStyles.headerCellSx}
              >
                {t(`columns.${column}`)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {pagedTickets.map((ticket, index) => (
            <TableRow key={ticket.id} sx={maintenanceStyles.getTableRowSx(index)}>
              <TableCell title={ticket.id} sx={maintenanceStyles.extraStyleSx3}>
                {ticket.id}
              </TableCell>
              <TableCell title={ticket.property} sx={maintenanceStyles.extraStyleSx4}>
                {ticket.property}
              </TableCell>
              <TableCell sx={maintenanceStyles.bodyCellSx}>
                {formatMaintenanceCategory(ticket.category, (key) => t(`categories.${key}`))}
              </TableCell>
              <TableCell sx={maintenanceStyles.bodyCellSx}>
                <Stack direction="row" spacing={0.65} alignItems="center">
                  <Box sx={maintenanceStyles.extraStyleSx1(ticket)} />
                  <span>{t(`priorities.${ticket.priority}`)}</span>
                </Stack>
              </TableCell>
              <TableCell title={ticket.tenant} sx={maintenanceStyles.extraStyleSx5}>
                {ticket.tenant}
              </TableCell>
              <TableCell sx={maintenanceStyles.extraStyleSx6}>{ticket.openedAt}</TableCell>
              <TableCell sx={maintenanceStyles.bodyCellSx}>
                <Chip
                  label={t(`statuses.${ticket.status}`)}
                  size="small"
                  sx={maintenanceStyles.extraStyleSx2(ticket)}
                />
              </TableCell>
              <TableCell sx={maintenanceStyles.bodyCellSx} align="center">
                <Stack direction="row" spacing={0.4} justifyContent="center">
                  <IconButton
                    component={Link}
                    href={{
                      pathname: '/dashboard/maintenance/[id]',
                      params: { id: ticket.id },
                    }}
                    aria-label={t('viewTicket', { ticket: ticket.id })}
                    size="small"
                    sx={maintenanceStyles.iconButtonSx}
                  >
                    <VisibilityOutlinedIcon sx={maintenanceStyles.visibilityOutlinedIconSx} />
                  </IconButton>
                  {(ticket.permissions?.edit || ticket.permissions?.delete) && (
                    <IconButton
                      aria-label={t('actions.menu', { ticket: ticket.id })}
                      size="small"
                      onClick={(event) => {
                        onOpenMenu(event.currentTarget, ticket.id)
                      }}
                      sx={maintenanceStyles.iconButtonSx2}
                    >
                      <MoreVertRoundedIcon sx={maintenanceStyles.moreVertRoundedIconSx} />
                    </IconButton>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {pagedTickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={maintenanceStyles.bodyCellSx}>
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
