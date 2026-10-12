import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-29T09:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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
    const user = userEvent.setup({ delay: null })
    renderDialog()

    await user.click(screen.getByLabelText('Imóvel em questão'))
    await user.click(await screen.findByRole('option', { name: 'Outro' }))

    expect(screen.getByLabelText('Imóvel ou referência')).toBeVisible()
  })

  it('submits valid data through onCreate', async () => {
    const user = userEvent.setup({ delay: null })
    const onCreate = renderDialog()

    await user.type(screen.getByLabelText('Título'), 'Visita apartamento')
    await user.click(screen.getByLabelText('Imóvel em questão'))
    await user.click(await screen.findByRole('option', { name: 'Apartamento Jardins' }))
    await user.type(screen.getByLabelText('Cliente'), 'Cliente Teste')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')

    await user.click(screen.getByRole('button', { name: 'Criar evento' }))

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      participant: 'Cliente Teste',
      propertyId: 'apt-jardins-3q',
      title: 'Visita apartamento',
    })
  })

  it('submits the selected event kind through onCreate', async () => {
    const user = userEvent.setup({ delay: null })
    const onCreate = renderDialog()

    await user.type(screen.getByLabelText('Título'), 'Visita apartamento')
    await user.click(screen.getByLabelText('Tipo de evento'))
    await user.click(await screen.findByRole('option', { name: 'Visita' }))
    await user.click(screen.getByLabelText('Imóvel em questão'))
    await user.click(await screen.findByRole('option', { name: 'Apartamento Jardins' }))
    await user.type(screen.getByLabelText('Cliente'), 'Cliente Teste')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')

    await user.click(screen.getByRole('button', { name: 'Criar evento' }))

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0][0]).toMatchObject({ kind: 'VISIT' })
  })

  it('rejects a visit scheduled for less than 60 minutes', async () => {
    const user = userEvent.setup({ delay: null })
    const onCreate = renderDialog()

    await user.type(screen.getByLabelText('Título'), 'Visita rápida')
    await user.click(screen.getByLabelText('Tipo de evento'))
    await user.click(await screen.findByRole('option', { name: 'Visita' }))
    await user.click(screen.getByLabelText('Imóvel em questão'))
    await user.click(await screen.findByRole('option', { name: 'Apartamento Jardins' }))
    await user.type(screen.getByLabelText('Cliente'), 'Cliente Teste')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')

    const durationField = screen.getByLabelText('Duração')
    await user.clear(durationField)
    await user.type(durationField, '30')

    await user.click(screen.getByRole('button', { name: 'Criar evento' }))

    expect(await screen.findByText('Visitas devem ter duração mínima de 60 minutos')).toBeVisible()
    expect(onCreate).not.toHaveBeenCalled()
  })
})
