'use client'

import { useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { Box, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

import { brand, radius, surface } from '@shared/theme/tokens'

const CODE_LENGTH = 6

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
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
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
            <Box
              role="group"
              sx={{ display: 'flex', gap: { xs: 0.75, sm: 1.25 }, justifyContent: 'center' }}
            >
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
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={`${label} — dígito ${index + 1} de ${CODE_LENGTH}`}
                  value={digit}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(index, event.target.value)
                  }
                  onPaste={(event: ClipboardEvent<HTMLInputElement>) => handlePaste(index, event)}
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) =>
                    handleKeyDown(index, event)
                  }
                  onFocus={(event: React.FocusEvent<HTMLInputElement>) => event.target.select()}
                  sx={{
                    width: { xs: 32, sm: 48 },
                    height: { xs: 36, sm: 52 },
                    textAlign: 'center',
                    fontSize: { xs: 15, sm: 20 },
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    color: brand.graphite[500],
                    borderRadius: `${radius.sm}px`,
                    border: `1px solid ${fieldState.error ? brand.semantic.error : brand.neutral[100]}`,
                    bgcolor: surface.paper,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    '&:focus': {
                      borderColor: brand.magenta[500],
                      boxShadow: `0 0 0 3px ${muiAlpha(brand.magenta[500], 0.15)}`,
                    },
                  }}
                />
              ))}
            </Box>

            {fieldState.error ? (
              <Typography
                variant="body2"
                sx={{ color: brand.semantic.error, textAlign: 'center', mt: 0.75 }}
              >
                {fieldState.error.message}
              </Typography>
            ) : null}
          </Box>
        )
      }}
    />
  )
}
