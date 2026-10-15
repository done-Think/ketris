'use client'

import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { usePlatformFinance } from '../hooks/use-platform-finance'
import { tenantStatusChipColor } from '../utils/tenant-status'

export function PlatformFinancePage() {
  const t = useTranslations('platform.finance')
  const accountT = useTranslations('platform.account')
  const format = useFormatter()
  const financeQuery = usePlatformFinance()
  const finance = financeQuery.data
  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Box sx={{ pb: 1.75, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography component="h1" sx={headingSx}>
          {t('title')}
        </Typography>
        {finance ? (
          <Typography sx={{ color: brand.neutral[500], fontSize: 14, mt: 0.5 }}>
            {t('subtitle', {
              month: format.dateTime(new Date(finance.referenceDate), {
                month: 'long',
                year: 'numeric',
              }),
            })}
          </Typography>
        ) : null}
      </Box>

      {financeQuery.isPending ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : financeQuery.isError || !finance ? (
        <Typography sx={{ color: brand.neutral[500], fontSize: 13.5 }}>{t('loadError')}</Typography>
      ) : (
        <Stack spacing={2.4}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: { xs: 1.2, md: 1.6 },
            }}
          >
            <KpiCard label={t('kpis.mrr')} value={formatPrice(finance.mrr)} />
            <KpiCard
              label={t('kpis.payingAccounts')}
              value={format.number(finance.payingAccounts)}
            />
            <KpiCard
              label={t('kpis.trialAccounts')}
              value={format.number(finance.trialAccounts)}
              helper={t('kpis.suspendedAccounts', { count: finance.suspendedAccounts })}
            />
            <KpiCard
              label={t('kpis.churn')}
              value={
                finance.churnRate === null
                  ? '—'
                  : format.number(finance.churnRate, { style: 'percent', maximumFractionDigits: 2 })
              }
              helper={
                finance.churnRate === null
                  ? t('kpis.churnNoBase')
                  : t('kpis.canceledThisMonth', { count: finance.canceledThisMonth })
              }
            />
          </Box>

          <Box component="section" aria-labelledby="finance-by-type-title" sx={panelSx}>
            <Typography id="finance-by-type-title" component="h2" sx={sectionTitleSx}>
              {t('byAccountType.title')}
            </Typography>
            <Stack spacing={1.6} sx={{ mt: 1.8 }}>
              {finance.byAccountType.map((row) => {
                const share = finance.mrr > 0 ? row.mrr / finance.mrr : 0

                return (
                  <Box key={row.accountType}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography
                          sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}
                        >
                          {accountT(`accountTypes.${row.accountType}`)}
                        </Typography>
                        <Typography sx={{ color: brand.neutral[500], fontSize: 12.5 }}>
                          {t('byAccountType.activeAccounts', { count: row.activeAccounts })}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}
                        >
                          {formatPrice(row.mrr)}
                        </Typography>
                        <Typography sx={{ color: brand.neutral[500], fontSize: 12.5 }}>
                          {format.number(share, { style: 'percent', maximumFractionDigits: 0 })}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box
                      aria-hidden
                      sx={{
                        mt: 0.8,
                        height: 6,
                        borderRadius: radius.full,
                        bgcolor: brand.neutral[100],
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.round(share * 100)}%`,
                          height: '100%',
                          borderRadius: radius.full,
                          bgcolor: brand.magenta[500],
                        }}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Stack>
          </Box>

          <Box
            component="section"
            aria-labelledby="finance-accounts-title"
            sx={{ ...panelSx, p: 0, overflow: 'hidden' }}
          >
            <Box sx={{ px: { xs: 1.6, md: 2.2 }, py: 1.6 }}>
              <Typography id="finance-accounts-title" component="h2" sx={sectionTitleSx}>
                {t('accounts.title')}
              </Typography>
            </Box>
            {finance.accounts.length === 0 ? (
              <Typography sx={{ color: brand.neutral[500], fontSize: 13, px: 2.2, pb: 2.2 }}>
                {t('accounts.empty')}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('accounts.columns.account')}</TableCell>
                      <TableCell>{accountT('fields.accountType')}</TableCell>
                      <TableCell>{accountT('fields.status')}</TableCell>
                      <TableCell>{t('accounts.columns.usage')}</TableCell>
                      <TableCell align="right">{accountT('fields.monthlyCharge')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {finance.accounts.map((account) => {
                      const charge = account.monthlyCharge
                      const billed = account.status === 'ACTIVE'

                      return (
                        <TableRow key={account.id} hover>
                          <TableCell>
                            <Box
                              component={Link}
                              href={{
                                pathname: '/platform/tenants/[id]',
                                params: { id: account.id },
                              }}
                              sx={{ color: 'inherit', textDecoration: 'none' }}
                            >
                              {account.name}
                            </Box>
                          </TableCell>
                          <TableCell>{accountT(`accountTypes.${account.accountType}`)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={tenantStatusChipColor[account.status]}
                              variant={account.status === 'CANCELED' ? 'outlined' : 'filled'}
                              label={accountT(`statuses.${account.status}`)}
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {charge
                              ? t(
                                  charge.usageUnit === 'BROKERS'
                                    ? 'accounts.usageBrokers'
                                    : 'accounts.usageProperties',
                                  { usage: charge.usage, included: charge.includedUnits },
                                )
                              : '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Typography
                              component="span"
                              sx={{
                                fontSize: 13.5,
                                fontWeight: 800,
                                color: billed ? brand.graphite[500] : brand.neutral[500],
                              }}
                            >
                              {charge ? formatPrice(charge.total) : '—'}
                            </Typography>
                            {!billed ? (
                              <Typography sx={{ color: brand.neutral[500], fontSize: 11.5 }}>
                                {t('accounts.notBilled')}
                              </Typography>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Typography sx={{ color: brand.neutral[500], fontSize: 12.5 }}>{t('note')}</Typography>
        </Stack>
      )}
    </Box>
  )
}

function KpiCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Box sx={{ ...panelSx, p: { xs: 1.45, md: 2.2 } }}>
      <Typography
        sx={{
          color: brand.neutral[500],
          fontSize: { xs: 10.5, md: 11 },
          fontWeight: 900,
          letterSpacing: 0.25,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ color: brand.graphite[500], fontSize: { xs: 22, sm: 28 }, fontWeight: 900, mt: 0.7 }}
      >
        {value}
      </Typography>
      {helper ? (
        <Typography sx={{ color: brand.neutral[500], fontSize: 12, mt: 0.3 }}>{helper}</Typography>
      ) : null}
    </Box>
  )
}

const headingSx = {
  color: brand.graphite[500],
  fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  fontSize: { xs: 26, sm: 30 },
  fontWeight: 700,
  lineHeight: 1.15,
}
const panelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  p: { xs: 1.6, md: 2.2 },
  minWidth: 0,
}
const sectionTitleSx = { color: brand.graphite[500], fontSize: 16, fontWeight: 900 }
