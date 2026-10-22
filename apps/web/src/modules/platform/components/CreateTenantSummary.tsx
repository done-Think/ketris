'use client'

import { Avatar, Box, Card, Chip, Divider, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { ApiPlatformPlan } from '../types/platform-plan'
import type { TenantAccountType } from '../types/tenant'
import { accountInitials } from '../utils/account-type-icons'
import { tenantStatusChipColor } from '../utils/tenant-status'

interface CreateTenantSummaryProps {
  name: string
  slug: string
  accountType: TenantAccountType
  status: 'TRIAL' | 'ACTIVE'
  plan: ApiPlatformPlan | undefined
}

// Live preview of the account being created and what comes next.
export function CreateTenantSummary({
  name,
  slug,
  accountType,
  status,
  plan,
}: CreateTenantSummaryProps) {
  const t = useTranslations('platform.createAccount.summary')
  const stepsT = useTranslations('platform.createAccount.nextSteps')
  const accountT = useTranslations('platform.account')
  const format = useFormatter()
  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })
  const displayName = name.trim()

  return (
    <Card
      component="aside"
      aria-label={t('title')}
      variant="outlined"
      sx={{
        position: { lg: 'sticky' },
        top: { lg: 24 },
        bgcolor: surface.paper,
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
      }}
    >
      <Box sx={{ p: 2.2 }}>
        <Typography
          sx={{
            color: brand.neutral[500],
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0.25,
            textTransform: 'uppercase',
          }}
        >
          {t('title')}
        </Typography>
        <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mt: 1.6 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha.magenta[10],
              color: brand.magenta[500],
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            {accountInitials(displayName) || '?'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: displayName ? brand.graphite[500] : brand.neutral[400],
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              {displayName || t('namePlaceholder')}
            </Typography>
            <Typography
              noWrap
              sx={{ color: brand.neutral[500], fontSize: 12.5, fontFamily: 'monospace' }}
            >
              {slug || t('slugPlaceholder')}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: alpha.graphite[6] }} />

      <Stack spacing={1.3} sx={{ p: 2.2 }}>
        <SummaryRow label={t('accountType')}>{accountT(`accountTypes.${accountType}`)}</SummaryRow>
        <SummaryRow label={t('status')}>
          <Chip
            size="small"
            color={tenantStatusChipColor[status]}
            label={accountT(`statuses.${status}`)}
          />
        </SummaryRow>
        <SummaryRow label={t('monthlyFee')}>
          {plan ? t('pricePerMonth', { price: formatPrice(plan.monthlyPrice) }) : '—'}
        </SummaryRow>
        {plan ? (
          <Typography sx={{ color: brand.neutral[500], fontSize: 12, textAlign: 'right' }}>
            {t(plan.usageUnit === 'BROKERS' ? 'extraBrokers' : 'extraProperties', {
              price: formatPrice(plan.extraUnitPrice),
              count: plan.includedUnits,
            })}
          </Typography>
        ) : null}
        {status === 'TRIAL' ? (
          <Typography sx={{ color: brand.neutral[500], fontSize: 12, textAlign: 'right' }}>
            {t('trialNotBilled')}
          </Typography>
        ) : null}
      </Stack>

      <Divider sx={{ borderColor: alpha.graphite[6] }} />

      <Box sx={{ p: 2.2 }}>
        <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900, mb: 1.2 }}>
          {stepsT('title')}
        </Typography>
        <Stack component="ol" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {(['create', 'admin', 'finance'] as const).map((step, index) => (
            <Stack component="li" key={step} direction="row" spacing={1.2} alignItems="center">
              <Box
                aria-hidden
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  borderRadius: radius.full,
                  bgcolor: index === 0 ? brand.magenta[500] : brand.neutral[100],
                  color: index === 0 ? surface.paper : brand.neutral[500],
                  fontSize: 11.5,
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </Box>
              <Typography
                sx={{
                  color: index === 0 ? brand.graphite[500] : brand.neutral[500],
                  fontSize: 13,
                  fontWeight: index === 0 ? 700 : 500,
                }}
              >
                {stepsT(step)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Card>
  )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>{label}</Typography>
      <Box sx={{ color: brand.graphite[500], fontSize: 13.5, fontWeight: 800, textAlign: 'right' }}>
        {children}
      </Box>
    </Stack>
  )
}
