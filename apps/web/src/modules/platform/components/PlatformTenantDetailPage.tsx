'use client'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { useTenants } from '../hooks/use-tenants'
import type { PlatformTenant } from '../types/tenant'
import { accountInitials } from '../utils/account-type-icons'
import { tenantStatusChipColor } from '../utils/tenant-status'
import { CreateTenantAdminForm } from './CreateTenantAdminForm'
import { EditTenantAccountDialog } from './EditTenantAccountDialog'
import { TenantUsersList } from './TenantUsersList'

export function PlatformTenantDetailPage({ tenantId }: { tenantId: string }) {
  const t = useTranslations('platform.tenant')
  const accountT = useTranslations('platform.account')
  const tenantsQuery = useTenants()
  const tenant = tenantsQuery.data?.find((candidate) => candidate.id === tenantId)
  const [editing, setEditing] = useState(false)

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Box
        component={Link}
        href="/platform/tenants"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          mb: 2,
          color: brand.neutral[500],
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          '&:hover': { color: brand.magenta[500] },
        }}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: iconSize.md }} />
        {t('back')}
      </Box>

      {tenantsQuery.isPending ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : !tenant ? (
        <Box sx={{ ...cardSx, p: 3 }}>
          <Typography
            component="h1"
            sx={{ color: brand.graphite[500], fontSize: 18, fontWeight: 900 }}
          >
            {tenantsQuery.isError ? t('loadError') : t('notFound')}
          </Typography>
        </Box>
      ) : (
        <>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            spacing={2}
            sx={{ pb: 2, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Stack direction="row" spacing={1.6} alignItems="center" sx={{ minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: alpha.magenta[10],
                  color: brand.magenta[500],
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                {accountInitials(tenant.name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h1" sx={headingSx}>
                  {tenant.name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 0.6 }}
                >
                  <Typography
                    sx={{ color: brand.neutral[500], fontSize: 13, fontFamily: 'monospace' }}
                  >
                    {tenant.slug}
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={accountT(`accountTypes.${tenant.accountType}`)}
                  />
                  <Chip
                    size="small"
                    color={tenantStatusChipColor[tenant.status]}
                    variant={tenant.status === 'CANCELED' ? 'outlined' : 'filled'}
                    label={accountT(`statuses.${tenant.status}`)}
                  />
                </Stack>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<EditOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
              onClick={() => setEditing(true)}
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, flexShrink: 0 }}
            >
              {t('editAccount')}
            </Button>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' },
              gap: 2.4,
              alignItems: 'start',
            }}
          >
            <TenantUsersList tenantId={tenant.id} />

            <Stack spacing={2.4}>
              <TenantAccountCard tenant={tenant} />
              <Card
                component="section"
                aria-labelledby="tenant-new-admin-title"
                variant="outlined"
                sx={cardSx}
              >
                <Box sx={{ px: 2.2, pt: 2.2, pb: 1.6 }}>
                  <Typography
                    id="tenant-new-admin-title"
                    component="h2"
                    sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}
                  >
                    {t('newAdmin.title')}
                  </Typography>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 13, mt: 0.3 }}>
                    {t('newAdmin.description')}
                  </Typography>
                </Box>
                <Box sx={{ px: 2.2, pb: 2.2 }}>
                  <CreateTenantAdminForm tenantId={tenant.id} />
                </Box>
              </Card>
            </Stack>
          </Box>

          {editing ? (
            <EditTenantAccountDialog tenant={tenant} onClose={() => setEditing(false)} />
          ) : null}
        </>
      )}
    </Box>
  )
}

function TenantAccountCard({ tenant }: { tenant: PlatformTenant }) {
  const t = useTranslations('platform.tenant.account')
  const accountT = useTranslations('platform.account')
  const plansT = useTranslations('platform.plans')
  const format = useFormatter()
  const charge = tenant.monthlyCharge
  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })

  return (
    <Card component="section" aria-labelledby="tenant-account-title" variant="outlined" sx={cardSx}>
      <Typography
        id="tenant-account-title"
        component="h2"
        sx={{
          color: brand.graphite[500],
          fontSize: 16,
          fontWeight: 900,
          px: 2.2,
          pt: 2.2,
          pb: 1.4,
        }}
      >
        {t('title')}
      </Typography>
      <Divider sx={{ borderColor: alpha.graphite[6] }} />
      <Stack spacing={1.3} sx={{ p: 2.2 }}>
        <AccountRow label={t('accountType')}>
          {accountT(`accountTypes.${tenant.accountType}`)}
        </AccountRow>
        <AccountRow label={t('status')}>
          <Chip
            size="small"
            color={tenantStatusChipColor[tenant.status]}
            variant={tenant.status === 'CANCELED' ? 'outlined' : 'filled'}
            label={accountT(`statuses.${tenant.status}`)}
          />
        </AccountRow>
        <AccountRow label={t('monthlyFee')}>{charge ? formatPrice(charge.total) : '—'}</AccountRow>
        {charge && charge.extraUnits > 0 ? (
          <Typography sx={{ color: brand.neutral[500], fontSize: 12, textAlign: 'right' }}>
            {plansT(
              charge.usageUnit === 'BROKERS'
                ? 'chargeWithExtraBrokers'
                : 'chargeWithExtraProperties',
              {
                base: formatPrice(charge.basePrice),
                count: charge.extraUnits,
                extra: formatPrice(charge.extraAmount),
              },
            )}
          </Typography>
        ) : null}
        {charge ? (
          <AccountRow label={t('usage')}>
            {t(charge.usageUnit === 'BROKERS' ? 'usageBrokers' : 'usageProperties', {
              usage: charge.usage,
              included: charge.includedUnits,
            })}
          </AccountRow>
        ) : null}
        <AccountRow label={t('createdAt')}>
          {format.dateTime(new Date(tenant.createdAt))}
        </AccountRow>
        {tenant.canceledAt ? (
          <AccountRow label={t('canceledAt')}>
            {format.dateTime(new Date(tenant.canceledAt))}
          </AccountRow>
        ) : null}
      </Stack>
    </Card>
  )
}

function AccountRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>{label}</Typography>
      <Box sx={{ color: brand.graphite[500], fontSize: 13.5, fontWeight: 800, textAlign: 'right' }}>
        {children}
      </Box>
    </Stack>
  )
}

const headingSx = {
  color: brand.graphite[500],
  fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  fontSize: { xs: 24, sm: 28 },
  fontWeight: 700,
  lineHeight: 1.15,
  overflowWrap: 'anywhere',
}

const cardSx = {
  bgcolor: surface.paper,
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
}
