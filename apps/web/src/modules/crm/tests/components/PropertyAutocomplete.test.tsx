import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PropertyAutocomplete } from '../../components/opportunity-detail/PropertyAutocomplete'
import { useCrmProperties } from '../../hooks/use-opportunities'
import type { CrmPropertySummary } from '../../types/property'

vi.mock('../../hooks/use-opportunities', () => ({
  useCrmProperties: vi.fn(),
}))

const property: CrmPropertySummary = {
  id: 'property-1',
  title: 'Apartamento Jardins',
  purpose: 'RENT',
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

function mockPropertiesQuery(overrides: Record<string, unknown> = {}) {
  vi.mocked(useCrmProperties).mockReturnValue({
    data: [],
    isFetching: false,
    ...overrides,
  } as unknown as ReturnType<typeof useCrmProperties>)
}

describe('PropertyAutocomplete', () => {
  it('filters available properties on the server for lead creation', () => {
    mockPropertiesQuery()
    render(
      <PropertyAutocomplete
        value={null}
        onChange={vi.fn()}
        availableOnly
        label="Imóvel de interesse"
      />,
    )
    expect(useCrmProperties).toHaveBeenLastCalledWith({ status: 'PUBLISHED' })
  })
  beforeEach(() => {
    vi.clearAllMocks()
    mockPropertiesQuery()
  })

  it('renders options returned by the properties query', async () => {
    const user = userEvent.setup()
    mockPropertiesQuery({ data: [property] })

    render(<PropertyAutocomplete value={null} onChange={vi.fn()} />)

    await user.click(screen.getByLabelText(/^Imóvel/))

    expect(await screen.findByRole('option', { name: /Apartamento Jardins/ })).toBeVisible()
  })

  it('calls onChange with the selected property', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    mockPropertiesQuery({ data: [property] })

    render(<PropertyAutocomplete value={null} onChange={onChange} />)

    await user.click(screen.getByLabelText(/^Imóvel/))
    await user.click(await screen.findByRole('option', { name: /Apartamento Jardins/ }))

    expect(onChange).toHaveBeenCalledWith(property)
  })

  it('shows the empty state message when no properties match', async () => {
    const user = userEvent.setup()

    render(<PropertyAutocomplete value={null} onChange={vi.fn()} />)

    await user.click(screen.getByLabelText(/^Imóvel/))

    expect(await screen.findByText('Nenhum resultado.')).toBeVisible()
  })

  it('shows a validation error message when provided', () => {
    render(
      <PropertyAutocomplete
        value={null}
        onChange={vi.fn()}
        error
        helperText="Selecione um imóvel."
      />,
    )

    expect(screen.getByText('Selecione um imóvel.')).toBeVisible()
  })
})
