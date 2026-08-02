'use client'

import {
  Controller,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from 'react-hook-form'
import { TextField, type TextFieldProps } from '@mui/material'

type RhfTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> &
  Omit<TextFieldProps, 'name' | 'defaultValue' | 'value' | 'disabled'> & {
    disabled?: boolean
  }

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
      disabled={disabled}
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
