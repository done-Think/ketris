'use client'

import { Card, CircularProgress, Stack, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows } from '@shared/theme/tokens'

import { useTenants } from '../hooks/use-tenants'

export function TenantsList() {
  const t = useTranslations('platform.dashboard')
  const formsT = useTranslations('platform.forms')
  const format = useFormatter()
  const { data: tenants, isLoading, isError } = useTenants()
  const columns: GridColDef[] = [
    { field: 'nome', headerName: formsT('name'), flex: 1, minWidth: 220 },
    { field: 'slug', headerName: formsT('slug'), flex: 1, minWidth: 180 },
    {
      field: 'createdAt',
      headerName: t('createdAt'),
      flex: 0.9,
      minWidth: 180,
      valueFormatter: (value) => format.dateTime(new Date(value)),
    },
  ]

  return (
    <Card sx={{ borderRadius: `${radius.lg}px`, boxShadow: shadows.popover }}>
      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('loadError')}</Typography>
        </Stack>
      ) : tenants && tenants.length > 0 ? (
        <DataGrid
          rows={tenants}
          columns={columns}
          autoHeight
          rowHeight={52}
          hideFooter
          disableRowSelectionOnClick
          sx={gridSx}
        />
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('empty')}</Typography>
        </Stack>
      )}
    </Card>
  )
}

const gridSx = {
  border: 0,
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: brand.neutral[50],
    color: brand.neutral[500],
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  '& .MuiDataGrid-columnSeparator': { display: 'none' },
  '& .MuiDataGrid-cell': {
    alignItems: 'center',
    borderColor: alpha.graphite[6],
    color: brand.neutral[500],
    fontSize: 13.5,
    fontWeight: 600,
    outline: 'none',
    py: 0,
  },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
    outline: 'none',
  },
  '& .MuiDataGrid-row:hover': { bgcolor: brand.neutral[50] },
  '& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
}
