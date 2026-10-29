'use client'

import { getStyles } from '../styles/verification-code-field.styles'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { Box, Typography } from '@mui/material'

import { Controller, type FieldValues } from 'react-hook-form'

import type { VerificationCodeFieldProps } from '../types/verification-code'

const CODE_LENGTH = 6

export function VerificationCodeField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  disabled,
}: VerificationCodeFieldProps<TFieldValues>) {
  const t = useTranslations('auth.verificationCode')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const styles = getStyles(Boolean(fieldState.error))
        const value: string = field.value ?? ''
        const digits = Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? '')

        function focusInput(index: number) {
          const target = inputRefs.current[index]
          target?.focus()
          target?.select()
        }

        function distributeFrom(startIndex: number, incoming: string) {
          const nextDigits = [...digits]
          let cursor = startIndex

          for (const char of incoming) {
            if (cursor >= CODE_LENGTH) break
            nextDigits[cursor] = char
            cursor += 1
          }

          field.onChange(nextDigits.join(''))
          focusInput(Math.min(cursor, CODE_LENGTH - 1))
        }

        function handleChange(index: number, rawValue: string) {
          const onlyDigits = rawValue.replace(/\D/g, '')

          if (onlyDigits.length > 1) {
            distributeFrom(index, onlyDigits)
            return
          }

          const nextDigits = [...digits]
          nextDigits[index] = onlyDigits
          field.onChange(nextDigits.join(''))

          if (onlyDigits && index < CODE_LENGTH - 1) {
            focusInput(index + 1)
          }
        }

        function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
          const pasted = event.clipboardData.getData('text').replace(/\D/g, '')

          if (!pasted) return

          event.preventDefault()
          distributeFrom(index, pasted)
        }

        function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
          if (event.key === 'Backspace' && !digits[index] && index > 0) {
            event.preventDefault()
            const nextDigits = [...digits]
            nextDigits[index - 1] = ''
            field.onChange(nextDigits.join(''))
            focusInput(index - 1)
            return
          }

          if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault()
            focusInput(index - 1)
            return
          }

          if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
            event.preventDefault()
            focusInput(index + 1)
          }
        }

        return (
          <Box>
            <Box role="group" sx={styles.box}>
              {digits.map((digit, index) => (
                <Box
                  key={index}
                  component="input"
                  ref={(element: HTMLInputElement | null) => {
                    inputRefs.current[index] = element
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  disabled={disabled}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={t('digitLabel', { label, position: index + 1, total: CODE_LENGTH })}
                  aria-invalid={Boolean(fieldState.error)}
                  value={digit}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(index, event.target.value)
                  }
                  onPaste={(event: ClipboardEvent<HTMLInputElement>) => handlePaste(index, event)}
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) =>
                    handleKeyDown(index, event)
                  }
                  onFocus={(event: React.FocusEvent<HTMLInputElement>) => event.target.select()}
                  sx={styles.box2}
                />
              ))}
            </Box>

            {fieldState.error?.message ? (
              <Typography variant="body2" sx={styles.typography}>
                {fieldState.error.message}
              </Typography>
            ) : null}
          </Box>
        )
      }}
    />
  )
}
