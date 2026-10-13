'use client'

import { TextField } from '@mui/material'
import { Controller, type FieldPath, type FieldValues } from 'react-hook-form'

import type { RhfTextFieldProps } from '@shared/types'

export function RhfTextField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  shouldUnregister,
  disabled,
  ...textFieldProps
}: RhfTextFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          {...field}
          disabled={disabled}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? textFieldProps.helperText}
        />
      )}
    />
  )
}
