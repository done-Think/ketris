import { describe, expect, it } from 'vitest'

import { toDashboardProperty } from '../../utils/map-dashboard-property'
import type { Property } from '../../types/property'

const baseProperty: Property = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsibleUserId: 'user-1',
  title: 'Apartamento Jardins',
  description: 'Pronto para morar',
  purpose: 'RENT',
  type: 'apartamento',
  status: 'PUBLISHED',
  publishedAt: '2026-09-01T10:00:00.000Z',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
  address: {
    street: 'Alameda Lorena',
    number: '1420',
    complement: null,
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    latitude: null,
    longitude: null,
  },
  media: [
    {
      id: 'media-1',
      url: 'https://cdn.ketris.dev/foto.jpg',
      type: 'foto',
      order: 0,
      createdAt: '2026-08-01T10:00:00.000Z',
    },
  ],
  values: { price: 6500, condoFee: 1200, propertyTax: 380 },
  characteristics: { bedrooms: 3, bathrooms: 2, parkingSpots: 2, areaM2: 95 },
}

describe('toDashboardProperty', () => {
  it('formats a rental listing with a monthly price and rent-only pricing', () => {
    const result = toDashboardProperty(baseProperty)

    expect(result.purpose).toBe('Aluguel')
    expect(result.price).toBe('R$ 6.500/mês')
    expect(result.pricing.rent).toBe('R$ 6.500/mês')
    expect(result.pricing.sale).toBe('Não anunciado')
    expect(result.summary.area).toBe('95m²')
    expect(result.summary.bedrooms).toBe('3')
  })

  it('carries the raw responsible user id and API status through for permission checks', () => {
    const result = toDashboardProperty(baseProperty)

    expect(result.responsibleUserId).toBe('user-1')
    expect(result.apiStatus).toBe('PUBLISHED')
  })

  it('formats a sale listing without a monthly suffix and sale-only pricing', () => {
    const result = toDashboardProperty({
      ...baseProperty,
      purpose: 'SALE',
      values: { ...baseProperty.values, price: 4500000 },
    })

    expect(result.purpose).toBe('Venda')
    expect(result.price).toBe('R$ 4.500.000')
    expect(result.pricing.rent).toBe('Não anunciado')
    expect(result.pricing.sale).toBe('R$ 4.500.000')
  })

  it.each([
    ['DRAFT', 'Em análise'],
    ['PUBLISHED', 'Disponível'],
    ['RENTED', 'Alugado'],
    ['SOLD', 'Ativo'],
    ['INACTIVE', 'Inativo'],
  ] as const)('maps API status %s to dashboard status %s', (apiStatus, dashboardStatus) => {
    const result = toDashboardProperty({ ...baseProperty, status: apiStatus })

    expect(result.status).toBe(dashboardStatus)
  })

  it('a SOLD sale listing satisfies the "Vendido" filter convention (purpose Venda + status Ativo)', () => {
    const result = toDashboardProperty({ ...baseProperty, purpose: 'SALE', status: 'SOLD' })

    expect(result.purpose === 'Venda' && result.status === 'Ativo').toBe(true)
  })

  it('falls back to placeholders when characteristics/values are null', () => {
    const result = toDashboardProperty({
      ...baseProperty,
      values: { price: 6500, condoFee: null, propertyTax: null },
      characteristics: { bedrooms: null, bathrooms: null, parkingSpots: null, areaM2: null },
    })

    expect(result.summary.bedrooms).toBe('Não informado')
    expect(result.summary.area).toBe('Não informado')
    expect(result.summary.condominium).toBe('Não informado')
    expect(result.summary.iptu).toBe('Não informado')
  })

  it('falls back to a generic address label when there is no structured address', () => {
    const result = toDashboardProperty({ ...baseProperty, address: null })

    expect(result.address).toBe('Endereço não informado')
    expect(result.location).toBe('')
  })

  it('includes a "published" activity entry only when publishedAt is set', () => {
    const published = toDashboardProperty(baseProperty)
    const draft = toDashboardProperty({ ...baseProperty, publishedAt: null })

    expect(published.activityHistory.some((entry) => entry.label === 'Imóvel publicado')).toBe(true)
    expect(draft.activityHistory.some((entry) => entry.label === 'Imóvel publicado')).toBe(false)
  })
})
