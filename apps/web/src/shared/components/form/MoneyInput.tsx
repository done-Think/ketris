'use client'

import { forwardRef } from 'react'
import { useLocale } from 'next-intl'

import { formatMoneyInput, parseMoneyInput } from '@shared/lib/utils/currency-input'
import type { MoneyInputProps } from '@shared/types'

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { name, value, onChange, ...props },
  ref,
) {
  const locale = useLocale()
  return (
    <input
      {...props}
      ref={ref}
      name={name}
      inputMode="numeric"
      autoComplete="off"
      value={formatMoneyInput(value, locale)}
      onChange={(event) =>
        onChange({ target: { name, value: String(parseMoneyInput(event.target.value)) } })
      }
    />
  )
})
