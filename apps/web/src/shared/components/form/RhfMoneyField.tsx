'use client'

import { Controller, type FieldPath, type FieldValues } from 'react-hook-form'
import { InputAdornment, TextField } from '@mui/material'
import { useLocale } from 'next-intl'

import { formatCurrencySymbol } from '@shared/lib/utils/format'
import type { RhfMoneyFieldProps } from '@shared/types'

import { MoneyInput } from './MoneyInput'

export function RhfMoneyField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  shouldUnregister,
  disabled,
  slotProps,
  ...textFieldProps
}: RhfMoneyFieldProps<TFieldValues, TName>) {
  const locale = useLocale()
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          {...field}
          value={field.value ?? 0}
          onChange={(event) => field.onChange(Number(event.target.value))}
          disabled={disabled}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? textFieldProps.helperText}
          slotProps={{
            ...slotProps,
            input: {
              ...slotProps?.input,
              inputComponent: MoneyInput as never,
              startAdornment: (
                <InputAdornment position="start">{formatCurrencySymbol(locale)}</InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  )
}
