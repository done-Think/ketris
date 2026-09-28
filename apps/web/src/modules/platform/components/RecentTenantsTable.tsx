'use client'

import { Box, Chip, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { RecentTenant } from '../types/platform-overview'
import { platformTenantGridSx } from './platform-tenant-table.styles'
import { usePlatformGridLocale } from '../hooks/use-platform-grid-locale'

const planSx = {
  enterprise: { bgcolor: '#FCE3F1', color: brand.magenta[600] },
  proGrowth: { bgcolor: '#E8F0FF', color: brand.semantic.info },
  starterPack: { bgcolor: brand.neutral[100], color: brand.neutral[500] },
} as const

const statusSx = {
  active: { bgcolor: '#E7F7EE', color: brand.semantic.success },
  provisioning: { bgcolor: '#FFF0E6', color: '#D97706' },
  suspended: { bgcolor: '#FDEBEC', color: brand.semantic.error },
} as const

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
        <Typography
          noWrap
          sx={{
            alignItems: 'center',
            color: brand.graphite[500],
            display: 'flex',
            fontSize: 13.5,
            fontWeight: 900,
            height: '100%',
            py: 0,
            textAlign: 'left',
            width: '100%',
          }}
        >
          {row.name}
        </Typography>
      ),
    },
    {
      field: 'plan',
      headerName: t('columns.plan'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.9,
      minWidth: 130,
      renderCell: ({ row }) => (
        <Chip label={t(`plans.${row.plan}`)} size="small" sx={{ ...chipSx, ...planSx[row.plan] }} />
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
      field: 'registeredAt',
      valueFormatter: (value: string) =>
        format.dateTime(new Date(`${value}T00:00:00Z`), {
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
    {
      field: 'status',
      headerName: t('columns.status'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.9,
      minWidth: 130,
      renderCell: ({ row }) => (
        <Chip
          label={t(`statuses.${row.status}`)}
          size="small"
          sx={{ ...chipSx, ...statusSx[row.status] }}
        />
      ),
    },
  ]

  return (
    <Box
      component="section"
      aria-labelledby="recent-tenants-title"
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.md}px`,
        boxShadow: shadows.crmCard,
        overflow: 'hidden',
        p: { xs: 1.75, md: 2.75 },
      }}
    >
      <Typography
        id="recent-tenants-title"
        sx={{ color: brand.graphite[500], fontSize: 17, fontWeight: 900, mb: 2 }}
      >
        {t('title')}
      </Typography>
      <Box sx={{ height: 56 + tenants.length * 52 }}>
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

const chipSx = { borderRadius: `${radius.full}px`, fontSize: 10, fontWeight: 800, height: 22 }
