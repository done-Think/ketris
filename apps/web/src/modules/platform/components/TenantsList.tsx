'use client'

import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { useTenants } from '../hooks/use-tenants'
import type { MonthlyCharge } from '../types/platform-plan'
import type { PlatformTenant } from '../types/tenant'
import { tenantStatusChipColor } from '../utils/tenant-status'
import { EditTenantAccountDialog } from './EditTenantAccountDialog'

export function TenantsList() {
  const t = useTranslations('platform.dashboard')
  const formsT = useTranslations('platform.forms')
  const accountT = useTranslations('platform.account')
  const plansT = useTranslations('platform.plans')
  const format = useFormatter()
  const [editingTenant, setEditingTenant] = useState<PlatformTenant | null>(null)
  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })
  const describeCharge = (charge: MonthlyCharge) =>
    charge.extraUnits > 0
      ? plansT(
          charge.usageUnit === 'BROKERS' ? 'chargeWithExtraBrokers' : 'chargeWithExtraProperties',
          {
            base: formatPrice(charge.basePrice),
            count: charge.extraUnits,
            extra: formatPrice(charge.extraAmount),
          },
        )
      : plansT('chargeBaseOnly')
  const { data: tenants, isPending, isError } = useTenants()

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: surface.paper,
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
      }}
    >
      {isPending ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('loadError')}</Typography>
        </Stack>
      ) : tenants && tenants.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{formsT('name')}</TableCell>
                <TableCell>{formsT('slug')}</TableCell>
                <TableCell>{accountT('fields.accountType')}</TableCell>
                <TableCell>{accountT('fields.status')}</TableCell>
                <TableCell align="right">{accountT('fields.monthlyCharge')}</TableCell>
                <TableCell>{t('createdAt')}</TableCell>
                <TableCell align="right">
                  <Box component="span" sx={visuallyHiddenSx}>
                    {accountT('actions')}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>
                    <Box
                      component={Link}
                      href={{ pathname: '/platform/tenants/[id]', params: { id: tenant.id } }}
                      sx={{ color: 'inherit', display: 'inline-block', textDecoration: 'none' }}
                    >
                      {tenant.name}
                    </Box>
                  </TableCell>
                  <TableCell>{tenant.slug}</TableCell>
                  <TableCell>{accountT(`accountTypes.${tenant.accountType}`)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={tenantStatusChipColor[tenant.status]}
                      variant={tenant.status === 'CANCELED' ? 'outlined' : 'filled'}
                      label={accountT(`statuses.${tenant.status}`)}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {tenant.monthlyCharge ? (
                      <Tooltip title={describeCharge(tenant.monthlyCharge)}>
                        <Box component="span">{formatPrice(tenant.monthlyCharge.total)}</Box>
                      </Tooltip>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{format.dateTime(new Date(tenant.createdAt))}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={accountT('editAction', { name: tenant.name })}>
                      <IconButton
                        size="small"
                        aria-label={accountT('editAction', { name: tenant.name })}
                        onClick={() => setEditingTenant(tenant)}
                        sx={{ color: brand.neutral[500] }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: iconSize.sm }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('empty')}</Typography>
        </Stack>
      )}
      {editingTenant ? (
        <EditTenantAccountDialog tenant={editingTenant} onClose={() => setEditingTenant(null)} />
      ) : null}
    </Card>
  )
}

// Accessible name for the actions column without showing a header.
const visuallyHiddenSx = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
} as const
