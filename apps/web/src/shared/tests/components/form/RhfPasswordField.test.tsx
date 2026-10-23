import { fireEvent, render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { RhfPasswordField } from '../../../components/form/RhfPasswordField'

function PasswordForm({ readOnly = false }: { readOnly?: boolean }) {
  const { control } = useForm({ defaultValues: { password: 'segredo' } })

  return (
    <RhfPasswordField
      control={control}
      name="password"
      label="Senha"
      slotProps={{ input: { readOnly } }}
    />
  )
}

describe('RhfPasswordField', () => {
  it('toggles between hidden and visible password', () => {
    render(<PasswordForm />)
    const input = screen.getByLabelText('Senha')

    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar Senha' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar Senha' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('keeps the input slot props passed by the caller', () => {
    render(<PasswordForm readOnly />)

    expect(screen.getByLabelText('Senha')).toHaveAttribute('readonly')
  })
})
