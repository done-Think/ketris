'use client'

import { Box, Chip, Typography } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

import { financialStatusStyles } from '../config/financial-status-styles'
import type { FinancialEntriesTableProps, FinancialEntry } from '../types/financial-entry'
import { FinancialEntryDetailDialog } from './FinancialEntryDetailDialog'

function FinancialStatusCell({
  row,
  label,
}: GridRenderCellParams<FinancialEntry> & { label: string }) {
  const status = financialStatusStyles[row.status]

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        width: 'fit-content',
        bgcolor: status.bgcolor,
        color: status.color,
        borderRadius: `${radius.full}px`,
        fontSize: 10,
        fontWeight: 900,
      }}
    />
  )
}

export function FinancialEntriesTable({ entries }: FinancialEntriesTableProps) {
  const format = useFormatter()
  const t = useTranslations('dashboard.finance.table')
  const statusT = useTranslations('dashboard.finance.statuses')
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null)
  const formatCurrency = (value: number) =>
    `${value > 0 ? '+' : '-'}${format.number(Math.abs(value), {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })}`
  const columns: GridColDef<FinancialEntry>[] = [
    {
      field: 'date',
      headerName: t('date'),
      flex: 0.75,
      minWidth: 120,
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
      renderCell: ({ row }) => (
        <Typography
          sx={{
            color: row.amountValue >= 0 ? brand.semantic.success : brand.semantic.error,
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          {formatCurrency(row.amountValue)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: t('status'),
      flex: 0.7,
      minWidth: 120,
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
        p: { xs: 1.6, md: 2.4 },
        width: '100%',
        minWidth: 0,
      }}
    >
      <Typography sx={{ color: brand.graphite[500], fontSize: 18, fontWeight: 900, mb: 1.8 }}>
        {t('title')}
      </Typography>
      <DataGrid
        rows={entries}
        columns={columns}
        hideFooter
        autoHeight
        rowHeight={58}
        disableColumnMenu
        disableRowSelectionOnClick
        onRowClick={(params) => setSelectedEntry(params.row)}
        getRowClassName={(params) =>
          params.row.id === selectedEntry?.id ? 'financial-entry-row--selected' : ''
        }
        localeText={{ noRowsLabel: t('noRows') }}
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: brand.neutral[50],
            color: brand.neutral[500],
            fontSize: 11,
            fontWeight: 900,
            textTransform: 'uppercase',
          },
          '& .MuiDataGrid-columnSeparator': {
            display: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: 0,
            color: brand.neutral[500],
            fontSize: 13,
            fontWeight: 700,
            outline: 'none !important',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row': {
            borderBottom: '1px solid',
            borderColor: alpha.graphite[6],
            cursor: 'pointer',
            transition: motion.transition.bordered,
          },
          '& .MuiDataGrid-row.financial-entry-row--selected': {
            bgcolor: alpha.magenta[6],
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: brand.neutral[50],
          },
          '& .MuiDataGrid-row.financial-entry-row--selected:hover': {
            bgcolor: alpha.magenta[8],
          },
        }}
      />
      <FinancialEntryDetailDialog
        entry={selectedEntry}
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
      />
    </Box>
  )
}
