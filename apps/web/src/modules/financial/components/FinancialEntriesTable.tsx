'use client'

import { Box, Chip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type {
  FinancialEntriesTableProps,
  FinancialEntry,
  FinancialEntryStatus,
  FinancialEntryType,
} from '../types/financial-entry'

const financialStatusStyles: Record<FinancialEntryStatus, { bgcolor: string; color: string }> = {
  Recebido: { bgcolor: alpha.magenta[10], color: brand.magenta[700] },
  Previsto: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  Atrasado: { bgcolor: alpha.error[10], color: brand.semantic.error },
}

const financialTypeStyles: Record<FinancialEntryType, { bgcolor: string; color: string }> = {
  Venda: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  Comissão: { bgcolor: alpha.magenta[6], color: brand.magenta[700] },
}

function FinancialTypeCell({
  row,
  label,
}: GridRenderCellParams<FinancialEntry> & { label: string }) {
  const type = financialTypeStyles[row.type]

  return (
    <Chip
      label={label}
      sx={{
        width: 'fit-content',
        bgcolor: type.bgcolor,
        color: type.color,
        borderRadius: `${radius.full}px`,
        fontWeight: 900,
      }}
    />
  )
}

function FinancialStatusCell({
  row,
  label,
}: GridRenderCellParams<FinancialEntry> & { label: string }) {
  const status = financialStatusStyles[row.status]

  return (
    <Chip
      label={label}
      sx={{
        width: 'fit-content',
        bgcolor: status.bgcolor,
        color: status.color,
        borderRadius: `${radius.full}px`,
        fontWeight: 900,
      }}
    />
  )
}

export function FinancialEntriesTable({ entries }: FinancialEntriesTableProps) {
  const format = useFormatter()
  const t = useTranslations('dashboard.finance.table')
  const typeT = useTranslations('dashboard.finance.types')
  const statusT = useTranslations('dashboard.finance.statuses')
  const columns: GridColDef<FinancialEntry>[] = [
    {
      field: 'type',
      headerName: t('type'),
      flex: 0.75,
      minWidth: 130,
      renderCell: (params) => <FinancialTypeCell {...params} label={typeT(params.row.type)} />,
    },
    { field: 'description', headerName: t('description'), flex: 1.1, minWidth: 180 },
    { field: 'property', headerName: t('property'), flex: 1.4, minWidth: 220 },
    { field: 'dueDate', headerName: t('dueDate'), flex: 0.8, minWidth: 130 },
    {
      field: 'amountValue',
      headerName: t('amount'),
      flex: 0.8,
      minWidth: 130,
      valueFormatter: (value) =>
        format.number(value, {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }),
    },
    {
      field: 'status',
      headerName: t('status'),
      flex: 0.75,
      minWidth: 130,
      renderCell: (params) => (
        <FinancialStatusCell {...params} label={statusT(params.row.status)} />
      ),
    },
  ]

  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
        width: '100%',
        minWidth: 0,
      }}
    >
      <DataGrid
        rows={entries}
        columns={columns}
        autoHeight
        rowHeight={64}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        localeText={{
          noRowsLabel: t('noRows'),
          footerTotalRows: t('totalRows'),
          MuiTablePagination: {
            labelRowsPerPage: t('rowsPerPage'),
          },
        }}
        sx={{
          border: 0,
          minHeight: 360,
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: brand.neutral[50],
            color: brand.neutral[500],
            fontSize: 12,
            fontWeight: 900,
            textTransform: 'uppercase',
          },
          '& .MuiDataGrid-cell': {
            borderColor: 'divider',
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: brand.neutral[50],
          },
        }}
      />
    </Box>
  )
}
