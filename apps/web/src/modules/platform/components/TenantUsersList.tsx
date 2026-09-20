'use client'

import { Card, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows } from '@shared/theme/tokens'

import { useTenantUsers } from '../hooks/use-tenant-users'

type TenantUsersListProps = {
  tenantId: string
}

export function TenantUsersList({ tenantId }: TenantUsersListProps) {
  const t = useTranslations('platform.tenant')
  const formsT = useTranslations('platform.forms')
  const { data: users, isLoading, isError } = useTenantUsers(tenantId)
  const columns: GridColDef[] = [
    { field: 'nome', headerName: formsT('name'), flex: 1, minWidth: 180 },
    { field: 'email', headerName: formsT('email'), flex: 1.2, minWidth: 220 },
    { field: 'papel', headerName: formsT('role'), flex: 0.8, minWidth: 130 },
    {
      field: 'ativo',
      headerName: formsT('status'),
      flex: 0.7,
      minWidth: 120,
      renderCell: ({ row }) => (
        <Chip
          label={row.ativo ? formsT('active') : formsT('inactive')}
          color={row.ativo ? 'success' : 'default'}
          size="small"
        />
      ),
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
          <Typography color="text.secondary">{t('usersLoadError')}</Typography>
        </Stack>
      ) : users && users.length > 0 ? (
        <DataGrid
          rows={users}
          columns={columns}
          autoHeight
          rowHeight={52}
          hideFooter
          disableRowSelectionOnClick
          sx={gridSx}
        />
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('emptyUsers')}</Typography>
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
