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
    // Numeric form fields hold numbers, but the mask only accepts text.
    value: props.value == null ? '' : String(props.value),
    name,
    inputRef: ref,
    onAccept: (value: string) => onChange({ target: { name, value } }),
    overwrite: true,
  }
  if (typeof mask === 'string') return <IMaskInput {...inputProps} mask={mask} />
  if (!Array.isArray(mask)) {
    // Text field that accepts only numbers, without the browser spinner of type="number".
    return (
      <IMaskInput
        {...inputProps}
        {...mask}
        radix="."
        mapToRadix={[',']}
        thousandsSeparator=""
        normalizeZeros
        padFractionalZeros={false}
      />
    )
  }
  return <IMaskInput {...inputProps} mask={mask} />
})
