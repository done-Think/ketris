'use client'

import { forwardRef } from 'react'
import { IMaskInput } from 'react-imask'

import type { MaskedInputProps } from '@shared/types'

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(function MaskedInput(
  { mask, name, onChange, ...props },
  ref,
) {
  const inputProps = {
    ...props,
    name,
    inputRef: ref,
    onAccept: (value: string) => onChange({ target: { name, value } }),
    overwrite: true,
  }
  if (typeof mask === 'string') return <IMaskInput {...inputProps} mask={mask} />
  return <IMaskInput {...inputProps} mask={mask} />
})
