'use client'

import { Box, Typography } from '@mui/material'
import type { GridColDef } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useTranslations } from 'next-intl'

import { useFinancialFormat } from '../hooks/use-financial-format'
import type { FinancialEntriesTableProps, FinancialEntry } from '../types/financial-entry'
import { ChargeStatusChip } from './ChargeStatusChip'
import { getAmountStyles, styles } from '../styles/financial-entries-table.styles'

export function FinancialEntriesTable({ entries, onOpen }: FinancialEntriesTableProps) {
  const t = useTranslations('dashboard.finance.table')
  const format = useFinancialFormat()
  const formatCurrency = (value: number) =>
    `${value >= 0 ? '+' : '-'}${format.currency(Math.abs(value))}`
  const columns: GridColDef<FinancialEntry>[] = [
    {
      field: 'date',
      headerName: t('date'),
      flex: 0.75,
      minWidth: 120,
      valueFormatter: (value: string) => format.date(value),
    },
    {
      field: 'description',
      headerName: t('description'),
      flex: 1.35,
      minWidth: 190,
    },
    {
      field: 'property',
      headerName: t('property'),
      flex: 1.45,
      minWidth: 220,
    },
    {
      field: 'amountValue',
      headerName: t('amount'),
      flex: 0.8,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Box sx={styles.amountCell}>
          <Typography sx={getAmountStyles(row.amountValue)}>
            {formatCurrency(row.amountValue)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: t('status'),
      flex: 0.7,
      minWidth: 120,
      cellClassName: 'financial-status-cell',
      headerClassName: 'financial-status-header',
      renderCell: ({ row }) => (
        <Box sx={styles.statusCell}>
          <ChargeStatusChip status={row.status} />
        </Box>
      ),
    },
  ]

  return (
    <Box sx={styles.card}>
      <Typography sx={styles.title}>{t('title')}</Typography>
      <DataGrid
        rows={entries}
        columns={columns}
        hideFooter
        autoHeight
        rowHeight={58}
        disableColumnMenu
        disableRowSelectionOnClick
        onRowClick={(params) => onOpen(params.row.id)}
        localeText={{ noRowsLabel: t('noRows') }}
        sx={styles.dataGrid}
      />
    </Box>
  )
}
