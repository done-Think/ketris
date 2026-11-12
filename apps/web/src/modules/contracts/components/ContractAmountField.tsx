'use client'

import { useTranslations } from 'next-intl'
import { RhfMoneyField } from '@shared/components/form'
import type { ContractStepControlProps } from '../types/contract'
import { contractTextFieldSx } from '../styles/contract-form.styles'

export function ContractAmountField({ control }: ContractStepControlProps) {
  const t = useTranslations('contracts.wizard.conditions')
  return (
    <RhfMoneyField
      control={control}
      name="amount"
      label={t('fields.amount')}
      slotProps={{ inputLabel: { shrink: true } }}
      fullWidth
      sx={contractTextFieldSx}
    />
  )
}
