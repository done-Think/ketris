'use client'

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useTranslations } from 'next-intl'

import { useContractCharges } from '../hooks/use-financial'
import { useFinancialFormat } from '../hooks/use-financial-format'
import type { ContractChargesProps } from '../types/charge'
import { summarizeContractCharges } from '../utils/contract-charges'
import { Metric } from './Metric'

export function ContractChargeSummary({ contractId }: ContractChargesProps) {
  const t = useTranslations('charges.contract')
  const format = useFinancialFormat()
  const overview = summarizeContractCharges(useContractCharges(contractId).data ?? [], new Date())

  return (
    <>
      <Metric
        label={t('nextDue')}
        value={overview.nextDue ? format.date(overview.nextDue.dueDate) : t('noDate')}
        icon={<EventOutlinedIcon />}
        tone="success"
      />
      <Metric
        label={t('openTotal', { count: overview.openCount })}
        value={format.currency(overview.openTotal)}
        icon={<AccountBalanceWalletOutlinedIcon />}
        tone="warning"
      />
      <Metric
        label={t('overdueCount')}
        value={String(overview.overdue.length)}
        icon={<WarningAmberRoundedIcon />}
        tone="error"
      />
    </>
  )
}
