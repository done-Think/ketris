'use client'

import { formatCurrency } from '@shared/lib/utils/format'

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

import { usePlatformFinance } from '../hooks/use-platform-billing'
import type { MonthlyCharge } from '../types/platform-plan'
import type { PlatformTenant } from '../types/tenant'
import { accountInitials } from '../utils/account-type-icons'
import { tenantStatusChipColor } from '../utils/tenant-status'
import {
  styles,
  getBoxStyles,
  getBoxStyles2,
  getTypographyStyles,
} from '../styles/platform-finance-page.styles'

export function PlatformFinancePage() {
  const t = useTranslations('platform.finance')
  const accountT = useTranslations('platform.account')
  const format = useFormatter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const financeQuery = usePlatformFinance()
  const finance = financeQuery.data
  const formatPrice = (value: number) => formatCurrency(value, format.number)
  const formatShare = (value: number) =>
    format.number(value, { style: 'percent', maximumFractionDigits: 0 })

  return (
    <Box sx={styles.box}>
      <Box sx={styles.box2}>
        <Typography component="h1" sx={styles.heading}>
          {t('title')}
        </Typography>
        {finance ? (
          <Typography sx={styles.typography}>
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
        <Stack alignItems="center" sx={styles.stack}>
          <CircularProgress size={28} />
        </Stack>
      ) : financeQuery.isError || !finance ? (
        <Typography sx={styles.typography2}>{t('loadError')}</Typography>
      ) : (
        <Stack spacing={2.4}>
          <Box sx={styles.box3}>
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

          <Box component="section" aria-labelledby="finance-by-type-title" sx={styles.panel}>
            <Typography id="finance-by-type-title" component="h2" sx={styles.sectionTitle}>
              {t('byAccountType.title')}
            </Typography>
            <Stack spacing={1.6} sx={styles.stack2}>
              {finance.byAccountType.map((row) => {
                const share = finance.mrr > 0 ? row.mrr / finance.mrr : 0

                return (
                  <Box key={row.accountType} sx={styles.box4}>
                    <Box>
                      <Typography sx={styles.typography3}>
                        {accountT(`accountTypes.${row.accountType}`)}
                      </Typography>
                      <Typography sx={styles.typography4}>
                        {t('byAccountType.activeAccounts', { count: row.activeAccounts })}
                      </Typography>
                    </Box>
                    <Box aria-hidden sx={styles.box5}>
                      <Box sx={getBoxStyles({ share })} />
                    </Box>
                    <Typography sx={styles.typography5}>{formatShare(share)}</Typography>
                    <Typography sx={styles.typography6}>{formatPrice(row.mrr)}</Typography>
                  </Box>
                )
              })}
            </Stack>
          </Box>

          <Box component="section" aria-labelledby="finance-accounts-title" sx={styles.box6}>
            <Box sx={styles.box7}>
              <Typography id="finance-accounts-title" component="h2" sx={styles.sectionTitle}>
                {t('accounts.title')}
              </Typography>
            </Box>
            {finance.accounts.length === 0 ? (
              <Typography sx={styles.typography7}>{t('accounts.empty')}</Typography>
            ) : isMobile ? (
              <Box component="ul" sx={styles.box8}>
                {finance.accounts.map((account) => (
                  <Box component="li" key={account.id} sx={styles.box9}>
                    <Stack direction="row" spacing={1.2} alignItems="flex-start">
                      <AccountName account={account} />
                      {account.monthlyCharge ? (
                        <FeeCell
                          charge={account.monthlyCharge}
                          billed={account.status === 'ACTIVE'}
                        />
                      ) : null}
                    </Stack>
                    <Stack direction="row" spacing={0.8} sx={styles.stack3}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={accountT(`accountTypes.${account.accountType}`)}
                      />
                      <StatusChip account={account} />
                    </Stack>
                    {account.monthlyCharge ? (
                      <Box sx={styles.box10}>
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
                      <TableCell sx={styles.tableCell}>{t('accounts.columns.usage')}</TableCell>
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

          <Typography sx={styles.typography4}>{t('note')}</Typography>
        </Stack>
      )}
    </Box>
  )
}

function AccountName({ account }: { account: PlatformTenant }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={styles.stack4}>
      <Avatar aria-hidden sx={styles.avatar}>
        {accountInitials(account.name)}
      </Avatar>
      <Box
        component={Link}
        href={{ pathname: '/platform/tenants/[id]', params: { id: account.id } }}
        sx={styles.box11}
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

function UsageBar({ charge }: { charge: MonthlyCharge }) {
  const t = useTranslations('platform.finance.accounts')
  const over = charge.extraUnits > 0
  const ratio = charge.includedUnits > 0 ? Math.min(1, charge.usage / charge.includedUnits) : 1

  return (
    <Box sx={styles.box12}>
      <Box aria-hidden sx={styles.box13}>
        <Box sx={getBoxStyles2({ ratio, over })} />
      </Box>
      <Typography sx={styles.typography8}>
        {t(charge.usageUnit === 'BROKERS' ? 'usageBrokers' : 'usageProperties', {
          usage: charge.usage,
          included: charge.includedUnits,
        })}
        {over ? (
          <Box component="span" sx={styles.box14}>
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
  const formatPrice = (value: number) => formatCurrency(value, format.number)

  return (
    <Box sx={styles.box15}>
      <Typography component="span" sx={getTypographyStyles({ billed })}>
        {formatPrice(charge.total)}
      </Typography>
      {charge.extraAmount > 0 ? (
        <Typography sx={styles.typography9}>
          {t('includesExtras', { amount: formatPrice(charge.extraAmount) })}
        </Typography>
      ) : null}
      {!billed ? <Typography sx={styles.typography9}>{t('notBilled')}</Typography> : null}
    </Box>
  )
}

function KpiCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Box sx={styles.box16}>
      <Typography sx={styles.typography10}>{label}</Typography>
      <Typography sx={styles.typography11}>{value}</Typography>
      {helper ? <Typography sx={styles.typography12}>{helper}</Typography> : null}
    </Box>
  )
}
