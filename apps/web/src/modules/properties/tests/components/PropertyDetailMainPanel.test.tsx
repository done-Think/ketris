import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PropertyDetailMainPanel } from '../../components/PropertyDetailMainPanel'
import type { DashboardProperty } from '../../types/dashboard-property'
import { dashboardProperties } from '../fixtures/dashboard-properties'

const property: DashboardProperty = {
  ...dashboardProperties[0],
  description: 'Casa com jardim privativo.',
  listing: {
    amenities: ['furnished', 'petFriendly'],
    negotiationTerms: 'Pagamento à vista com desconto.',
    publishAfterReview: false,
    allowWhatsappContact: false,
    featured: false,
  },
}

describe('PropertyDetailMainPanel', () => {
  it('shows the saved description and translated amenities', () => {
    render(<PropertyDetailMainPanel property={property} activeTab="data" />)
    expect(screen.getByText('Casa com jardim privativo.')).toBeVisible()
    expect(screen.getByText('Mobiliado')).toBeVisible()
    expect(screen.getByText('Aceita pets')).toBeVisible()
  })

  it('shows negotiation terms without assigning them to an unrelated pricing field', () => {
    render(<PropertyDetailMainPanel property={property} activeTab="values" />)
    expect(screen.getByText('Condições de negociação')).toBeVisible()
    expect(screen.getByText('Pagamento à vista com desconto.')).toBeVisible()
    expect(screen.queryByText('TAXA DE ADMINISTRAÇÃO')).not.toBeInTheDocument()
    expect(screen.queryByText('GARANTIA')).not.toBeInTheDocument()
    expect(screen.queryByText('ÚLTIMO AJUSTE')).not.toBeInTheDocument()
  })
})
