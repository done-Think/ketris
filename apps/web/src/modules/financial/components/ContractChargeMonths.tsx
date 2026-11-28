'use client'

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { useContractCharges } from '../hooks/use-financial'
import { useFinancialFormat } from '../hooks/use-financial-format'
import { getMonthStatusChipStyles, styles } from '../styles/contract-charges.styles'
import type { ContractChargesProps } from '../types/charge'
import { groupContractChargesByMonth } from '../utils/contract-charges'
import { ChargeStatusChip } from './ChargeStatusChip'
import { ChargeReceiptLink } from './ChargeReceiptLink'

export function ContractChargeMonths({ contractId }: ContractChargesProps) {
  const t = useTranslations('charges.contract')
  const format = useFinancialFormat()
  const query = useContractCharges(contractId)

  if (query.isPending)
    return (
      <Stack alignItems="center" sx={styles.loading}>
        <CircularProgress size={24} />
      </Stack>
    )
  if (query.isError)
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
      >
        {t('loadError')}
      </Alert>
    )

  const months = groupContractChargesByMonth(query.data)
  if (!months.length) return <Typography sx={styles.empty}>{t('empty')}</Typography>

  return (
    <Stack sx={styles.months}>
      {months.map((month) => (
        <Box
          key={month.month}
          component="section"
          aria-label={format.month(month.month)}
          sx={styles.month}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.2}
            useFlexGap
            sx={styles.monthHeader}
          >
            <Typography component="h3" sx={styles.monthName}>
              {format.month(month.month)}
            </Typography>
            <Chip
              label={t(`monthStatuses.${month.status}`)}
              size="small"
              sx={getMonthStatusChipStyles(month.status)}
            />
            <Typography sx={styles.monthTotal}>{format.currency(month.total)}</Typography>
          </Stack>
          {month.charges.map((charge) => (
            <Box key={charge.id} sx={styles.charge}>
              <Box sx={styles.chargeTitle}>
                <MuiLink
                  component={Link}
                  href={{ pathname: '/dashboard/finance/charges/[id]', params: { id: charge.id } }}
                  aria-label={t('viewCharge', { code: charge.code })}
                  underline="hover"
                  sx={styles.code}
                >
                  {charge.code}
                </MuiLink>
                <Typography sx={styles.description}>
                  {charge.description ?? charge.property}
                </Typography>
              </Box>
              <Typography sx={styles.muted}>
                {t('dueOn', { date: format.date(charge.dueDate) })}
              </Typography>
              <Typography sx={styles.amount}>{format.currency(charge.amount)}</Typography>
              <Box sx={styles.status}>
                <ChargeStatusChip status={charge.status} />
              </Box>
              {charge.receipt ? (
                <Box sx={styles.receipt}>
                  <ChargeReceiptLink chargeId={charge.id} receipt={charge.receipt} />
                </Box>
              ) : null}
            </Box>
          ))}
        </Box>
      ))}
    </Stack>
  )
}
