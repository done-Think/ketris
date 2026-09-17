'use client'

import {
  Card,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { radius, shadows } from '@shared/theme/tokens'

import { useTenants } from '../hooks/use-tenants'

export function TenantsList() {
  const t = useTranslations('platform.dashboard')
  const formsT = useTranslations('platform.forms')
  const format = useFormatter()
  const { data: tenants, isLoading, isError } = useTenants()

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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{formsT('name')}</TableCell>
              <TableCell>{formsT('slug')}</TableCell>
              <TableCell>{t('createdAt')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow
                key={tenant.id}
                hover
                component={Link}
                href={{ pathname: '/platform/tenants/[id]', params: { id: tenant.id } }}
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <TableCell>{tenant.nome}</TableCell>
                <TableCell>{tenant.slug}</TableCell>
                <TableCell>{format.dateTime(new Date(tenant.createdAt))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('empty')}</Typography>
        </Stack>
      )}
    </Card>
  )
}
