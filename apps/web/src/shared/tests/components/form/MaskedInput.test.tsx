import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MaskedInput } from '@shared/components/form/MaskedInput'

describe('masked input adapter', () => {
  it('formats a fixed CPF mask and forwards the native input ref and field changes', async () => {
    const ref = createRef<HTMLInputElement>()
    const onChange = vi.fn()
    render(<MaskedInput ref={ref} name="cpf" mask="000.000.000-00" onChange={onChange} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '12345678901')
    expect(input).toHaveValue('123.456.789-01')
    expect(ref.current).toBe(input)
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'cpf', value: '123.456.789-01' } })
  })

  it('switches dynamically between landline and mobile masks', async () => {
    const onChange = vi.fn()
    render(
      <MaskedInput
        name="phone"
        mask={[{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]}
        onChange={onChange}
      />,
    )
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '1199999999')
    expect(input).toHaveValue('(11) 9999-9999')
    await userEvent.type(input, '9')
    expect(input).toHaveValue('(11) 99999-9999')
    expect(onChange).toHaveBeenLastCalledWith({
      target: { name: 'phone', value: '(11) 99999-9999' },
    })
  })
})
