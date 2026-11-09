import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MoneyInput } from '@shared/components/form/MoneyInput'

function renderInput(value: unknown, onChange = vi.fn()) {
  render(
    <MoneyInput name="amount" aria-label="Valor" value={value as number} onChange={onChange} />,
  )
  return { input: screen.getByLabelText('Valor'), onChange }
}

describe('MoneyInput', () => {
  it('shows the value with two decimals in the current locale', () => {
    expect(renderInput(1234.5).input).toHaveValue('1.234,50')
  })

  it.each([0, -5, 'abc'])('stays empty for %s', (value) => {
    expect(renderInput(value).input).toHaveValue('')
  })

  it('reads the typed digits as cents and drops the leading zero', () => {
    const { input, onChange } = renderInput(0)
    fireEvent.change(input, { target: { value: '0123' } })
    expect(onChange).toHaveBeenCalledWith({ target: { name: 'amount', value: '1.23' } })
  })

  it('ignores letters and symbols', () => {
    const { input, onChange } = renderInput(0)
    fireEvent.change(input, { target: { value: 'R$ 5a0,0' } })
    expect(onChange).toHaveBeenCalledWith({ target: { name: 'amount', value: '5' } })
  })

  it('opens the numeric keyboard on phones', () => {
    expect(renderInput(10).input).toHaveAttribute('inputmode', 'numeric')
  })
})
