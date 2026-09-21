import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MaintenanceCreateTicketDialog } from './MaintenanceCreateTicketDialog'
import { maintenanceTicketSchema } from '../schemas/maintenance-ticket-schema'

describe('MaintenanceCreateTicketDialog', () => {
  it('prevents an invalid ticket from being submitted', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()

    render(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={onCreate} />)

    expect(screen.queryByLabelText('Custo Estimado')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Criar Chamado' }))

    expect(await screen.findByText('Selecione o imóvel')).toBeVisible()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('does not include estimated cost in the form schema', () => {
    const values = maintenanceTicketSchema.parse({
      propertyId: 'apt-jardins-3q',
      category: 'Hidráulica',
      priority: 'normal',
      title: 'Vazamento na cozinha',
      description: 'A pia está vazando.',
      estimatedCost: '120,00',
    })

    expect(values).not.toHaveProperty('estimatedCost')
  })

  it('submits a valid ticket and resets when opened again', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const { rerender } = render(
      <MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={onCreate} />,
    )

    await user.click(screen.getByLabelText('Imóvel'))
    await user.click(await screen.findByRole('option', { name: 'Apt Jardins 3q' }))
    await user.click(screen.getByLabelText('Categoria'))
    await user.click(await screen.findByRole('option', { name: 'Hidráulica' }))
    await user.type(screen.getByLabelText('Título do Chamado'), 'Vazamento na cozinha')
    await user.type(screen.getByLabelText('Relato do Problema'), 'A pia está vazando.')
    // fireEvent (not userEvent) on purpose: userEvent's full pointer sequence triggers MUI's
    // ripple effect, whose exit animation schedules a state update that fires after this test's
    // rerender() calls below, outside act() — fireEvent.click skips mousedown/mouseup so no
    // ripple ever starts.
    fireEvent.click(screen.getByRole('button', { name: 'Criar Chamado' }))

    // react-hook-form's handleSubmit resolves the zod validation asynchronously even for a
    // synchronous schema, so onCreate only fires a microtask after this click — fireEvent.click
    // (unlike userEvent.click) doesn't await that internally.
    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: 'apt-jardins-3q',
          category: 'Hidráulica',
          title: 'Vazamento na cozinha',
        }),
      ),
    )

    rerender(<MaintenanceCreateTicketDialog open={false} onClose={vi.fn()} onCreate={onCreate} />)
    rerender(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={onCreate} />)

    expect(screen.getByLabelText('Título do Chamado')).toHaveValue('')
  })

  it('closes without creating a ticket when cancelled', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onCreate = vi.fn()

    render(<MaintenanceCreateTicketDialog open onClose={onClose} onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(onCreate).not.toHaveBeenCalled()
  })
})
