'use client'

import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { RecentTenant } from '../types/platform-overview'

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
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 650 }} aria-label={t('tableLabel')}>
          <TableHead>
            <TableRow>
              {(['name', 'plan', 'brokers', 'registeredAt', 'status'] as const).map((column) => (
                <TableCell key={column} sx={headerCellSx}>
                  {t(`columns.${column}`)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell sx={{ ...bodyCellSx, color: brand.graphite[500], fontWeight: 800 }}>
                  {tenant.name}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  <Chip
                    label={t(`plans.${tenant.plan}`)}
                    size="small"
                    sx={{ ...chipSx, ...planSx[tenant.plan] }}
                  />
                </TableCell>
                <TableCell sx={bodyCellSx}>{tenant.brokers}</TableCell>
                <TableCell sx={bodyCellSx}>{tenant.registeredAt}</TableCell>
                <TableCell sx={bodyCellSx}>
                  <Chip
                    label={t(`statuses.${tenant.status}`)}
                    size="small"
                    sx={{ ...chipSx, ...statusSx[tenant.status] }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}

const headerCellSx = {
  bgcolor: brand.neutral[50],
  borderBottom: 0,
  color: brand.neutral[500],
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.4,
  py: 1.4,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}
const bodyCellSx = {
  borderColor: alpha.graphite[6],
  color: brand.neutral[500],
  fontSize: 13,
  fontWeight: 600,
  py: 1.45,
  whiteSpace: 'nowrap',
}
const chipSx = { borderRadius: `${radius.full}px`, fontSize: 10, fontWeight: 800, height: 22 }
