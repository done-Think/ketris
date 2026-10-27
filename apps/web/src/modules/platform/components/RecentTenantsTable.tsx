'use client'

import { Box, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { useFormatter, useTranslations } from 'next-intl'

import type { RecentTenant } from '../types/platform-overview'
import { platformTenantGridSx } from '../styles/platform-tenant-table.styles'
import { usePlatformGridLocale } from '../hooks/use-platform-grid-locale'
import { styles, getBoxStyles } from '../styles/recent-tenants-table.styles'

export function RecentTenantsTable({ tenants }: { tenants: readonly RecentTenant[] }) {
  const t = useTranslations('platform.overview.recentTenants')
  const gridLocale = usePlatformGridLocale()
  const format = useFormatter()
  const columns: GridColDef<RecentTenant>[] = [
    {
      field: 'name',
      headerName: t('columns.name'),
      align: 'left',
      headerAlign: 'left',
      flex: 1.5,
      minWidth: 210,
      renderCell: ({ row }) => (
        <Typography noWrap sx={styles.typography}>
          {row.name}
        </Typography>
      ),
    },
    {
      field: 'brokers',
      headerName: t('columns.brokers'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.7,
      minWidth: 110,
    },
    {
      field: 'properties',
      headerName: t('columns.properties'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.7,
      minWidth: 110,
    },
    {
      field: 'registeredAt',
      valueFormatter: (value: string) =>
        format.dateTime(new Date(value), {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'UTC',
        }),
      headerName: t('columns.registeredAt'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.9,
      minWidth: 130,
    },
  ]

  return (
    <Box component="section" aria-labelledby="recent-tenants-title" sx={styles.box}>
      <Typography id="recent-tenants-title" sx={styles.typography2}>
        {t('title')}
      </Typography>
      <Box sx={getBoxStyles({ tenants })}>
        <DataGrid
          aria-label={t('tableLabel')}
          localeText={gridLocale}
          rows={tenants}
          columns={columns}
          rowHeight={52}
          hideFooter
          disableRowSelectionOnClick
          disableColumnMenu
          sx={platformTenantGridSx}
        />
      </Box>
    </Box>
  )
}
