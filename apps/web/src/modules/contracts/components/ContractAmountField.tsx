'use client'

import { TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import type { ContractStepControlProps } from '../types/contract'
import { contractTextFieldSx } from '../styles/contract-form.styles'

export function ContractAmountField({ control }: ContractStepControlProps) {
  const t = useTranslations('contracts.wizard.conditions')
  return (
    <Controller
      control={control}
      name="amount"
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value || ''}
          onChange={(event) =>
            field.onChange(event.target.value === '' ? 0 : Number(event.target.value))
          }
          type="number"
          label={t('fields.amount')}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          inputProps={{ step: '0.01', min: '0.01', max: '9999999999.99', inputMode: 'decimal' }}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={contractTextFieldSx}
        />
      )}
    />
  )
}
