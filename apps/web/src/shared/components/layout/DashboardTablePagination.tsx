import { styles } from '@shared/styles/dashboard-table-pagination.styles'
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
    <Box component="footer" sx={styles.box}>
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
