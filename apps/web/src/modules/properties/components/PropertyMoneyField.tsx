'use client'

import { forwardRef } from 'react'
import { TextField } from '@mui/material'
import { useLocale } from 'next-intl'
import { IMaskInput } from 'react-imask'

import { getNumberSeparators } from '@shared/lib/utils/currency-input'
import type { PropertyMoneyInputProps, PropertyMoneyFieldProps } from '../types/dashboard-property'

const MoneyInput = forwardRef<HTMLInputElement, PropertyMoneyInputProps>(function MoneyInput(
  { name, onChange, ...props },
  ref,
) {
  const locale = useLocale()
  const { group, decimal } = getNumberSeparators(locale)
  return (
    <IMaskInput
      {...props}
      name={name}
      inputRef={ref}
      mask={Number}
      scale={2}
      radix={decimal}
      thousandsSeparator={group}
      mapToRadix={[]}
      min={0}
      normalizeZeros={false}
      padFractionalZeros={false}
      unmask
      onAccept={(value) => onChange({ target: { name, value: String(value) } })}
    />
  )
})

export function PropertyMoneyField({
  value,
  onValueChange,
  slotProps,
  ...props
}: PropertyMoneyFieldProps) {
  return (
    <TextField
      {...props}
      value={value ? String(value) : ''}
      onChange={(event) => onValueChange(Number(event.target.value))}
      slotProps={{
        ...slotProps,
        input: { ...slotProps?.input, inputComponent: MoneyInput as never },
        htmlInput: { ...slotProps?.htmlInput, inputMode: 'decimal' },
      }}
    />
  )
}
