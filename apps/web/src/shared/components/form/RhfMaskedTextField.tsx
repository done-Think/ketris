'use client'

import { Controller, type FieldPath, type FieldValues } from 'react-hook-form'
import { TextField } from '@mui/material'

import type { RhfMaskedTextFieldProps } from '@shared/types'

import { MaskedInput } from './MaskedInput'

export function RhfMaskedTextField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  shouldUnregister,
  disabled,
  mask,
  slotProps,
  ...textFieldProps
}: RhfMaskedTextFieldProps<TFieldValues, TName>) {
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
          disabled={disabled}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? textFieldProps.helperText}
          slotProps={{
            ...slotProps,
            input: {
              ...slotProps?.input,
              inputComponent: MaskedInput as never,
            },
            htmlInput: {
              ...slotProps?.htmlInput,
              mask,
            },
          }}
        />
      )}
    />
  )
}
