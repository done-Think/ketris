import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { RhfMoneyField } from '@shared/components/form'

function MoneyForm({ amount, onValue }: { amount: number; onValue: (value: number) => void }) {
  const { control, watch } = useForm({ defaultValues: { amount } })
  onValue(watch('amount'))
  return <RhfMoneyField control={control} name="amount" label="Valor" />
}

describe('RhfMoneyField', () => {
  it('shows the currency symbol and the saved value with two decimals', () => {
    render(<MoneyForm amount={2300.5} onValue={vi.fn()} />)
    expect(screen.getByText('R$')).toBeVisible()
    expect(screen.getByLabelText('Valor')).toHaveValue('2.300,50')
  })

  it('fills the cents from the right and drops leading zeros', async () => {
    const onValue = vi.fn()
    render(<MoneyForm amount={0} onValue={onValue} />)
    const input = screen.getByLabelText('Valor')
    expect(input).toHaveValue('')
    await userEvent.type(input, '0123')
    expect(input).toHaveValue('1,23')
    expect(onValue).toHaveBeenLastCalledWith(1.23)
    await userEvent.type(input, '4567')
    expect(input).toHaveValue('12.345,67')
    expect(onValue).toHaveBeenLastCalledWith(12345.67)
  })

  it('removes the last digit on backspace and ignores letters', async () => {
    const onValue = vi.fn()
    render(<MoneyForm amount={0} onValue={onValue} />)
    const input = screen.getByLabelText('Valor')
    await userEvent.type(input, '12a3{Backspace}')
    expect(input).toHaveValue('0,12')
    expect(onValue).toHaveBeenLastCalledWith(0.12)
  })
})
