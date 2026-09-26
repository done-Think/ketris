import { Box, TablePagination } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { DashboardTablePaginationProps } from '@shared/types/dashboard-table-pagination'

export function DashboardTablePagination({
  count,
  onPageChange,
  onRowsPerPageChange,
  page,
  rowsPerPage,
  rowsPerPageOptions = [5, 10, 25],
}: DashboardTablePaginationProps) {
  const t = useTranslations('common.dashboardPagination')

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
        '& .MuiTablePagination-toolbar': {
          minHeight: 58,
          px: 2,
        },
        '& .MuiTablePagination-spacer': {
          flex: 1,
        },
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
          m: 0,
          fontSize: 13,
          fontWeight: 500,
        },
      }}
    >
      <TablePagination
        component="div"
        count={count}
        page={Math.max(0, page - 1)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        labelRowsPerPage={t('rowsPerPage')}
        labelDisplayedRows={({ from, to, count: total }) =>
          t('displayedRows', { from, to, count: total })
        }
        onPageChange={(_, nextPage) => onPageChange?.(nextPage + 1)}
        onRowsPerPageChange={(event) => onRowsPerPageChange?.(Number(event.target.value))}
      />
    </Box>
  )
}
