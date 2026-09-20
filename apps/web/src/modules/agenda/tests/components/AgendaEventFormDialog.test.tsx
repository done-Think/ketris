import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgendaEventFormDialog } from '../../components/AgendaEventFormDialog'
import type { AgendaPropertyOption } from '../../types/agenda-event'

const propertyOptions: AgendaPropertyOption[] = [
  {
    href: '/dashboard/properties/apt-jardins-3q',
    id: 'apt-jardins-3q',
    label: 'Apartamento Jardins',
  },
]

function renderDialog(onCreate = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <AgendaEventFormDialog
        maxDate="2026-12-31"
        minDate="2026-01-01"
        onClose={vi.fn()}
        onCreate={onCreate}
        open
        propertyOptions={propertyOptions}
      />
    </ThemeProvider>,
  )

  return onCreate
}

describe('AgendaEventFormDialog', () => {
  it('renders the translated fields and actions', () => {
    renderDialog()

    expect(screen.getByText('Adicionar evento')).toBeVisible()
    expect(screen.getByLabelText('Título')).toBeVisible()
    expect(screen.getByLabelText('Imóvel em questão')).toBeVisible()
    expect(screen.getByLabelText('Cliente')).toBeVisible()
    expect(screen.getByLabelText('Telefone')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Criar evento' })).toBeVisible()
  })

  it('shows the custom property field when "Outro" is selected', async () => {
    renderDialog()

    await userEvent.click(screen.getByLabelText('Imóvel em questão'))
    await userEvent.click(await screen.findByRole('option', { name: 'Outro' }))

    expect(screen.getByLabelText('Imóvel ou referência')).toBeVisible()
  })

  it('submits valid data through onCreate', async () => {
    const onCreate = renderDialog()

    await userEvent.type(screen.getByLabelText('Título'), 'Visita apartamento')
    await userEvent.click(screen.getByLabelText('Imóvel em questão'))
    await userEvent.click(await screen.findByRole('option', { name: 'Apartamento Jardins' }))
    await userEvent.type(screen.getByLabelText('Cliente'), 'Cliente Teste')
    await userEvent.type(screen.getByLabelText('Telefone'), '11987654321')

    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      participant: 'Cliente Teste',
      propertyId: 'apt-jardins-3q',
      title: 'Visita apartamento',
    })
  })
})
