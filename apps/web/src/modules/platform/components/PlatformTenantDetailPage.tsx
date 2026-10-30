'use client'

import { formatCurrency } from '@shared/lib/utils/format'

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

import { usePlatformActor } from '../hooks/use-platform-actor'
import { useTenant } from '../hooks/use-tenants'
import type { PlatformTenant } from '../types/tenant'
import { accountInitials } from '../utils/account-type-icons'
import { isNotFoundError } from '../utils/is-not-found-error'
import { tenantStatusChipColor } from '../utils/tenant-status'
import { CreateTenantAdminForm } from './CreateTenantAdminForm'
import { EditTenantAccountDialog } from './EditTenantAccountDialog'
import { TenantUsersList } from './TenantUsersList'
import { styles } from '../styles/platform-tenant-detail-page.styles'

export function PlatformTenantDetailPage({ tenantId }: { tenantId: string }) {
  const t = useTranslations('platform.tenant')
  const accountT = useTranslations('platform.account')
  const { canManage } = usePlatformActor()
  const tenantQuery = useTenant(tenantId)
  const tenant = tenantQuery.data
  const [editing, setEditing] = useState(false)

  return (
    <Box sx={styles.box}>
      <Box component={Link} href="/platform/tenants" sx={styles.box2}>
        <ArrowBackRoundedIcon sx={styles.arrowBackRoundedIcon} />
        {t('back')}
      </Box>

      {tenantQuery.isPending ? (
        <Stack alignItems="center" sx={styles.stack}>
          <CircularProgress size={28} />
        </Stack>
      ) : !tenant ? (
        <Box sx={styles.box3}>
          <Typography component="h1" sx={styles.typography}>
            {isNotFoundError(tenantQuery.error) ? t('notFound') : t('loadError')}
          </Typography>
        </Box>
      ) : (
        <>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            spacing={2}
            sx={styles.stack2}
          >
            <Stack direction="row" spacing={1.6} alignItems="center" sx={styles.stack3}>
              <Avatar sx={styles.avatar}>{accountInitials(tenant.name)}</Avatar>
              <Box sx={styles.stack3}>
                <Typography component="h1" sx={styles.heading}>
                  {tenant.name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={styles.stack4}
                >
                  <Typography sx={styles.typography2}>{tenant.slug}</Typography>
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
            {canManage ? (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<EditOutlinedIcon sx={styles.editOutlinedIcon} />}
                onClick={() => setEditing(true)}
                sx={styles.button}
              >
                {t('editAccount')}
              </Button>
            ) : null}
          </Stack>

          <Box sx={styles.box4}>
            <TenantUsersList tenantId={tenant.id} />

            <Stack spacing={2.4}>
              <TenantAccountCard tenant={tenant} />
              {canManage ? (
                <Card
                  component="section"
                  aria-labelledby="tenant-new-admin-title"
                  variant="outlined"
                  sx={styles.card}
                >
                  <Box sx={styles.box5}>
                    <Typography id="tenant-new-admin-title" component="h2" sx={styles.typography3}>
                      {t('newAdmin.title')}
                    </Typography>
                    <Typography sx={styles.typography4}>{t('newAdmin.description')}</Typography>
                  </Box>
                  <Box sx={styles.box6}>
                    <CreateTenantAdminForm tenantId={tenant.id} />
                  </Box>
                </Card>
              ) : null}
            </Stack>
          </Box>

          {editing && canManage ? (
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
  const formatPrice = (value: number) => formatCurrency(value, format.number)

  return (
    <Card
      component="section"
      aria-labelledby="tenant-account-title"
      variant="outlined"
      sx={styles.card}
    >
      <Typography id="tenant-account-title" component="h2" sx={styles.typography5}>
        {t('title')}
      </Typography>
      <Divider sx={styles.divider} />
      <Stack spacing={1.3} sx={styles.stack5}>
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
          <Typography sx={styles.typography6}>
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
      <Typography sx={styles.typography7}>{label}</Typography>
      <Box sx={styles.box7}>{children}</Box>
    </Stack>
  )
}
