import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProperties } from '@modules/properties/hooks/use-properties'

import { MaintenanceCreateTicketDialog } from '../../components/MaintenanceCreateTicketDialog'
import { maintenanceTicketSchema } from '../../schemas/maintenance-ticket-schema'

vi.mock('@modules/properties/hooks/use-properties', () => ({
  useProperties: vi.fn(),
}))

const properties = [
  { id: 'apt-jardins-3q', title: 'Apt Jardins 3q' },
  { id: 'studio-pinheiros', title: 'Studio Pinheiros' },
]

function mockProperties() {
  vi.mocked(useProperties).mockReturnValue({
    data: properties,
  } as unknown as ReturnType<typeof useProperties>)
}

describe('MaintenanceCreateTicketDialog', () => {
  beforeEach(() => {
    vi.mocked(useProperties).mockReset()
    mockProperties()
  })

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

  it('lists the real properties returned by useProperties', async () => {
    const user = userEvent.setup()

    render(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={vi.fn()} />)

    await user.click(screen.getByLabelText('Imóvel'))
    expect(await screen.findByRole('option', { name: 'Apt Jardins 3q' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Studio Pinheiros' })).toBeVisible()
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
    fireEvent.click(screen.getByRole('button', { name: 'Criar Chamado' }))

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
