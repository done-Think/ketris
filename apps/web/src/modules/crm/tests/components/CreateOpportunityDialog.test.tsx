vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 'tenant-1' }, status: 'authenticated' }),
}))
vi.mock('../../hooks/use-contacts', () => ({
  useCrmContactOptions: () => ({ data: [], isFetching: false }),
}))
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateOpportunityDialog } from '../../components/opportunity-detail/CreateOpportunityDialog'
import { useCrmProperties } from '../../hooks/use-opportunities'
import { property } from '../fixtures/property'

vi.mock('../../hooks/use-opportunities', () => ({
  useCrmProperties: vi.fn(),
}))

describe('CreateOpportunityDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCrmProperties).mockReturnValue({
      data: [property],
      isFetching: false,
    } as unknown as ReturnType<typeof useCrmProperties>)
  })

  it('renders the create title and required fields', () => {
    render(
      <CreateOpportunityDialog
        open
        tenantId="tenant-1"
        isPending={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Nova oportunidade' })).toBeVisible()
    expect(screen.getByLabelText(/^Imóvel/)).toBeVisible()
    expect(screen.getByLabelText(/^Valor proposto/)).toBeVisible()
  })

  it('validates required fields before saving', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <CreateOpportunityDialog
        open
        tenantId="tenant-1"
        isPending={false}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar oportunidade' }))

    expect(await screen.findByText('Selecione um imóvel.')).toBeVisible()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('selects a property and submits the form', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <CreateOpportunityDialog
        open
        tenantId="tenant-1"
        isPending={false}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByLabelText(/^Imóvel/))
    await user.click(await screen.findByText(/Apartamento Jardins/))
    await user.type(screen.getByLabelText(/^Nome/), 'Maria Silva')
    await user.type(screen.getByLabelText(/^E-mail/), 'maria@example.com')
    await user.type(screen.getByLabelText(/^Valor proposto/), '2500')
    await user.click(screen.getByRole('button', { name: 'Criar oportunidade' }))

    expect(onSave.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        property,
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        proposedValue: '2500',
        status: 'RASCUNHO',
      }),
    )
  })

  it('calls onClose from the cancel button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <CreateOpportunityDialog
        open
        tenantId="tenant-1"
        isPending={false}
        onClose={onClose}
        onSave={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
