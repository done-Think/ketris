'use client'

import { Avatar, Box, Card, Chip, Divider, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { accountInitials } from '../utils/account-type-icons'
import { tenantStatusChipColor } from '../utils/tenant-status'
import {
  styles,
  getTypographyStyles,
  getBoxStyles,
  getTypographyStyles2,
} from '../styles/create-tenant-summary.styles'
import type { CreateTenantSummaryProps } from '../types/tenant'

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
    <Card component="aside" aria-label={t('title')} variant="outlined" sx={styles.card}>
      <Box sx={styles.box}>
        <Typography sx={styles.typography}>{t('title')}</Typography>
        <Stack direction="row" spacing={1.4} alignItems="center" sx={styles.stack}>
          <Avatar sx={styles.avatar}>{accountInitials(displayName) || '?'}</Avatar>
          <Box sx={styles.box2}>
            <Typography noWrap sx={getTypographyStyles({ displayName })}>
              {displayName || t('namePlaceholder')}
            </Typography>
            <Typography noWrap sx={styles.typography2}>
              {slug || t('slugPlaceholder')}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={styles.divider} />

      <Stack spacing={1.3} sx={styles.box}>
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
          <Typography sx={styles.typography3}>
            {t(plan.usageUnit === 'BROKERS' ? 'extraBrokers' : 'extraProperties', {
              price: formatPrice(plan.extraUnitPrice),
              count: plan.includedUnits,
            })}
          </Typography>
        ) : null}
        {status === 'TRIAL' ? (
          <Typography sx={styles.typography3}>{t('trialNotBilled')}</Typography>
        ) : null}
      </Stack>

      <Divider sx={styles.divider} />

      <Box sx={styles.box}>
        <Typography sx={styles.typography4}>{stepsT('title')}</Typography>
        <Stack component="ol" spacing={1} sx={styles.stack2}>
          {(['create', 'admin', 'finance'] as const).map((step, index) => (
            <Stack component="li" key={step} direction="row" spacing={1.2} alignItems="center">
              <Box aria-hidden sx={getBoxStyles({ index })}>
                {index + 1}
              </Box>
              <Typography sx={getTypographyStyles2({ index })}>{stepsT(step)}</Typography>
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
      <Typography sx={styles.typography5}>{label}</Typography>
      <Box sx={styles.box3}>{children}</Box>
    </Stack>
  )
}
