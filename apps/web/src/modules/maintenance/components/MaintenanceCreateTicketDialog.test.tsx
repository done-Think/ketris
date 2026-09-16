import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MaintenanceCreateTicketDialog } from './MaintenanceCreateTicketDialog'

describe('MaintenanceCreateTicketDialog', () => {
  it('prevents an invalid ticket from being submitted', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()

    render(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={onCreate} />)

    expect(screen.getByLabelText('Custo Estimado')).toHaveValue('0,00')
    await user.click(screen.getByRole('button', { name: 'Criar Chamado' }))

    expect(await screen.findByText('Selecione o imóvel')).toBeVisible()
    expect(onCreate).not.toHaveBeenCalled()
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
    await user.click(screen.getByRole('button', { name: 'Criar Chamado' }))

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: 'apt-jardins-3q',
        category: 'Hidráulica',
        title: 'Vazamento na cozinha',
      }),
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
