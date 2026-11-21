'use client'

import { Alert, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useContractCharges } from '../hooks/use-financial'
import { useFinancialFormat } from '../hooks/use-financial-format'
import type { ContractChargesProps } from '../types/charge'
import { contractChargeDueSoonDays, summarizeContractCharges } from '../utils/contract-charges'

export function ContractChargeAlerts({ contractId }: ContractChargesProps) {
  const t = useTranslations('charges.contract.alerts')
  const format = useFinancialFormat()
  const { data: session } = useSession()
  const charges = useContractCharges(contractId).data ?? []
  const overview = summarizeContractCharges(charges, new Date())
  const managing =
    session?.role === 'OWNER' && charges.some((charge) => charge.tenantId === session.tenantId)
  const [oldestOverdue] = overview.overdue
  const [nextDueSoon] = overview.dueSoon

  if (!oldestOverdue && (managing || !nextDueSoon)) return null

  return (
    <Stack spacing={1}>
      {oldestOverdue && (
        <Alert severity="error">
          {t('overdue', {
            count: overview.overdue.length,
            total: format.currency(overview.overdueTotal),
            date: format.date(oldestOverdue.dueDate),
          })}
        </Alert>
      )}
      {!managing && nextDueSoon && (
        <Alert severity="warning">
          {t('dueSoon', {
            count: overview.dueSoon.length,
            days: contractChargeDueSoonDays,
            total: format.currency(overview.dueSoonTotal),
            date: format.date(nextDueSoon.dueDate),
          })}
        </Alert>
      )}
    </Stack>
  )
}
