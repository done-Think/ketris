import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardTablePagination } from '@shared/components/layout'

import { chargesRowsPerPageOptions, chargesTableColumns } from '../config/charges-table'
import { styles } from '../styles/charges-table.styles'
import type { ChargesTableProps } from '../types/charge'
import { ChargeRow } from './ChargeRow'

export function ChargesTable({
  rows,
  readOnly,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onCancel,
  onDelete,
}: ChargesTableProps) {
  const t = useTranslations('charges.table')

  return (
    <Paper variant="outlined" sx={styles.paper}>
      <TableContainer sx={styles.container}>
        <Table size="small" sx={styles.table}>
          <TableHead>
            <TableRow sx={styles.headRow}>
              {chargesTableColumns.map((key) => (
                <TableCell key={key}>{t(key)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={chargesTableColumns.length} sx={styles.empty}>
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((charge, index) => (
                <ChargeRow
                  key={charge.id}
                  charge={charge}
                  zebra={index % 2 === 1}
                  readOnly={readOnly}
                  onView={() => onView(charge)}
                  onEdit={() => onEdit(charge)}
                  onCancel={() => onCancel(charge)}
                  onDelete={() => onDelete(charge)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <DashboardTablePagination
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={chargesRowsPerPageOptions}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Paper>
  )
}
