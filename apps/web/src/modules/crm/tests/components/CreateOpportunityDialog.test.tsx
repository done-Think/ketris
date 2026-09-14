import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateOpportunityDialog } from '../../components/opportunity-detail/CreateOpportunityDialog'
import { useCrmProperties } from '../../hooks/use-opportunities'
import type { PublicPropertySummary } from '../../types/property'

vi.mock('../../hooks/use-opportunities', () => ({
  useCrmProperties: vi.fn(),
}))

const property: PublicPropertySummary = {
  id: 'property-1',
  title: 'Apartamento Jardins',
  purpose: 'ALUGUEL',
  propertyType: 'Apartamento',
  price: 3500,
  condoFee: null,
  propertyTax: null,
  bedrooms: 2,
  bathrooms: 1,
  parkingSpots: 1,
  area: 70,
  city: 'Sao Paulo',
  neighborhood: 'Jardins',
  latitude: null,
  longitude: null,
  brokerName: null,
  brokerAvatarUrl: null,
  coverUrl: null,
  publishedAt: '2026-08-01T10:00:00.000Z',
}

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
        propertyId: 'property-1',
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
