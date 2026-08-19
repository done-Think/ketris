'use client'

import { forwardRef, type ComponentType, type ForwardedRef } from 'react'
import { IMaskInput } from 'react-imask'

import type { MaskedInputProps } from '@shared/types'

const MaskInput = IMaskInput as unknown as ComponentType<
  Record<string, unknown> & {
    inputRef: ForwardedRef<HTMLInputElement>
    onAccept: (value: unknown) => void
  }
>

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(function MaskedInput(
  { mask, name, onChange, ...props },
  ref,
) {
  return (
    <MaskInput
      {...props}
      mask={mask}
      name={name}
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name, value: String(value) } })}
      overwrite
    />
  )
})
