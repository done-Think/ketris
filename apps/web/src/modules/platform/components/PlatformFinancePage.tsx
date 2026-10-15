'use client'

import {
  Avatar,
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
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { usePlatformFinance } from '../hooks/use-platform-finance'
import type { MonthlyCharge } from '../types/platform-plan'
import type { PlatformTenant } from '../types/tenant'
import { accountInitials } from '../utils/account-type-icons'
import { tenantStatusChipColor } from '../utils/tenant-status'

export function PlatformFinancePage() {
  const t = useTranslations('platform.finance')
  const accountT = useTranslations('platform.account')
  const format = useFormatter()
  const theme = useTheme()
  // On phones the five columns do not fit: each account becomes a stacked row instead.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const financeQuery = usePlatformFinance()
  const finance = financeQuery.data
  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })
  const formatShare = (value: number) =>
    format.number(value, { style: 'percent', maximumFractionDigits: 0 })

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
            <Stack spacing={1.6} sx={{ mt: 2 }}>
              {finance.byAccountType.map((row) => {
                const share = finance.mrr > 0 ? row.mrr / finance.mrr : 0

                return (
                  <Box
                    key={row.accountType}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: 'minmax(0, 1fr) auto auto',
                        md: '220px minmax(0, 1fr) 56px 120px',
                      },
                      columnGap: 2,
                      rowGap: 0.8,
                      alignItems: 'center',
                    }}
                  >
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
                    <Box
                      aria-hidden
                      sx={{
                        gridColumn: { xs: '1 / -1', md: 'auto' },
                        gridRow: { xs: 2, md: 'auto' },
                        height: 8,
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
                    <Typography
                      sx={{
                        color: brand.neutral[500],
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: 'right',
                      }}
                    >
                      {formatShare(share)}
                    </Typography>
                    <Typography
                      sx={{
                        color: brand.graphite[500],
                        fontSize: 14,
                        fontWeight: 800,
                        textAlign: 'right',
                      }}
                    >
                      {formatPrice(row.mrr)}
                    </Typography>
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
            <Box
              sx={{
                px: { xs: 1.6, md: 2.2 },
                py: 1.6,
                borderBottom: '1px solid',
                borderColor: alpha.graphite[6],
              }}
            >
              <Typography id="finance-accounts-title" component="h2" sx={sectionTitleSx}>
                {t('accounts.title')}
              </Typography>
            </Box>
            {finance.accounts.length === 0 ? (
              <Typography sx={{ color: brand.neutral[500], fontSize: 13, px: 2.2, py: 2.2 }}>
                {t('accounts.empty')}
              </Typography>
            ) : isMobile ? (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {finance.accounts.map((account) => (
                  <Box
                    component="li"
                    key={account.id}
                    sx={{
                      px: 1.6,
                      py: 1.6,
                      borderBottom: '1px solid',
                      borderColor: alpha.graphite[6],
                      '&:last-of-type': { borderBottom: 0 },
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="flex-start">
                      <AccountName account={account} />
                      {account.monthlyCharge ? (
                        <FeeCell
                          charge={account.monthlyCharge}
                          billed={account.status === 'ACTIVE'}
                        />
                      ) : null}
                    </Stack>
                    <Stack direction="row" spacing={0.8} sx={{ mt: 1, ml: 5.4 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={accountT(`accountTypes.${account.accountType}`)}
                      />
                      <StatusChip account={account} />
                    </Stack>
                    {account.monthlyCharge ? (
                      <Box sx={{ mt: 1.2, ml: 5.4 }}>
                        <UsageBar charge={account.monthlyCharge} />
                      </Box>
                    ) : null}
                  </Box>
                ))}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('accounts.columns.account')}</TableCell>
                      <TableCell>{accountT('fields.accountType')}</TableCell>
                      <TableCell>{accountT('fields.status')}</TableCell>
                      <TableCell sx={{ minWidth: 220 }}>{t('accounts.columns.usage')}</TableCell>
                      <TableCell align="right">{accountT('fields.monthlyCharge')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {finance.accounts.map((account) => (
                      <TableRow key={account.id} hover>
                        <TableCell>
                          <AccountName account={account} />
                        </TableCell>
                        <TableCell>{accountT(`accountTypes.${account.accountType}`)}</TableCell>
                        <TableCell>
                          <StatusChip account={account} />
                        </TableCell>
                        <TableCell>
                          {account.monthlyCharge ? (
                            <UsageBar charge={account.monthlyCharge} />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {account.monthlyCharge ? (
                            <FeeCell
                              charge={account.monthlyCharge}
                              billed={account.status === 'ACTIVE'}
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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

function AccountName({ account }: { account: PlatformTenant }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
      <Avatar
        aria-hidden
        sx={{
          width: 32,
          height: 32,
          bgcolor: alpha.magenta[8],
          color: brand.magenta[500],
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {accountInitials(account.name)}
      </Avatar>
      <Box
        component={Link}
        href={{ pathname: '/platform/tenants/[id]', params: { id: account.id } }}
        sx={{
          color: brand.graphite[500],
          fontWeight: 700,
          textDecoration: 'none',
          minWidth: 0,
          '&:hover': { color: brand.magenta[500], textDecoration: 'underline' },
        }}
      >
        {account.name}
      </Box>
    </Stack>
  )
}

function StatusChip({ account }: { account: PlatformTenant }) {
  const accountT = useTranslations('platform.account')

  return (
    <Chip
      size="small"
      color={tenantStatusChipColor[account.status]}
      variant={account.status === 'CANCELED' ? 'outlined' : 'filled'}
      label={accountT(`statuses.${account.status}`)}
    />
  )
}

// How much of the plan the account uses; turns orange when it pays for extra units.
function UsageBar({ charge }: { charge: MonthlyCharge }) {
  const t = useTranslations('platform.finance.accounts')
  const over = charge.extraUnits > 0
  const ratio = charge.includedUnits > 0 ? Math.min(1, charge.usage / charge.includedUnits) : 1

  return (
    <Box sx={{ minWidth: 180 }}>
      <Box
        aria-hidden
        sx={{
          height: 6,
          borderRadius: radius.full,
          bgcolor: brand.neutral[100],
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${Math.round(ratio * 100)}%`,
            height: '100%',
            borderRadius: radius.full,
            bgcolor: over ? brand.semantic.warning : brand.magenta[500],
          }}
        />
      </Box>
      <Typography sx={{ color: brand.neutral[500], fontSize: 12, mt: 0.6 }}>
        {t(charge.usageUnit === 'BROKERS' ? 'usageBrokers' : 'usageProperties', {
          usage: charge.usage,
          included: charge.includedUnits,
        })}
        {over ? (
          <Box component="span" sx={{ color: brand.semantic.warning, fontWeight: 800 }}>
            {' · '}
            {t('extraUnits', { count: charge.extraUnits })}
          </Box>
        ) : null}
      </Typography>
    </Box>
  )
}

function FeeCell({ charge, billed }: { charge: MonthlyCharge; billed: boolean }) {
  const t = useTranslations('platform.finance.accounts')
  const format = useFormatter()
  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })

  return (
    <Box sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
      <Typography
        component="span"
        sx={{
          fontSize: 14,
          fontWeight: 800,
          color: billed ? brand.graphite[500] : brand.neutral[500],
        }}
      >
        {formatPrice(charge.total)}
      </Typography>
      {charge.extraAmount > 0 ? (
        <Typography sx={{ color: brand.neutral[500], fontSize: 11.5 }}>
          {t('includesExtras', { amount: formatPrice(charge.extraAmount) })}
        </Typography>
      ) : null}
      {!billed ? (
        <Typography sx={{ color: brand.neutral[500], fontSize: 11.5 }}>{t('notBilled')}</Typography>
      ) : null}
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
