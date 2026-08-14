'use client'

import { Box, Chip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'

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

function FinancialTypeCell({ row }: GridRenderCellParams<FinancialEntry>) {
  const type = financialTypeStyles[row.type]

  return (
    <Chip
      label={row.type}
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

function FinancialStatusCell({ row }: GridRenderCellParams<FinancialEntry>) {
  const status = financialStatusStyles[row.status]

  return (
    <Chip
      label={row.status}
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
  const columns: GridColDef<FinancialEntry>[] = [
    {
      field: 'type',
      headerName: 'Tipo',
      flex: 0.75,
      minWidth: 130,
      renderCell: (params) => <FinancialTypeCell {...params} />,
    },
    { field: 'description', headerName: 'Lançamento', flex: 1.1, minWidth: 180 },
    { field: 'property', headerName: 'Imóvel', flex: 1.4, minWidth: 220 },
    { field: 'dueDate', headerName: 'Vencimento', flex: 0.8, minWidth: 130 },
    {
      field: 'amountValue',
      headerName: 'Valor',
      flex: 0.8,
      minWidth: 130,
      valueFormatter: (value) =>
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(value),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.75,
      minWidth: 130,
      renderCell: (params) => <FinancialStatusCell {...params} />,
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
          noRowsLabel: 'Nenhum lançamento encontrado',
          footerTotalRows: 'Total de linhas:',
          MuiTablePagination: {
            labelRowsPerPage: 'Linhas por página',
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
