'use client'

import type { Control, FieldValues, Path } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'

import { AuthFormField } from './AuthFormField'
import { authTextFieldSx } from './auth-form.styles'

export interface VerificationCodeFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label: string
}

export function VerificationCodeField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
}: VerificationCodeFieldProps<TFieldValues>) {
  return (
    <AuthFormField htmlFor="verification-code" label={label} required>
      <RhfTextField
        id="verification-code"
        control={control}
        name={name}
        placeholder="000000"
        fullWidth
        slotProps={{
          htmlInput: {
            inputMode: 'numeric',
            maxLength: 6,
            autoComplete: 'one-time-code',
            style: { letterSpacing: '0.5em', textAlign: 'center', fontWeight: 600 },
          },
        }}
        sx={authTextFieldSx}
      />
    </AuthFormField>
  )
}
