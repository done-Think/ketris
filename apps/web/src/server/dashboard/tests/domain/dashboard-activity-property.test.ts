import { describe, expect, it } from 'vitest'

import { toVisibleActivityProperty } from '../../domain/dashboard-activity-property'
import type { DashboardActivityPropertySource } from '../../types/dashboard-overview'

const source = (
  status: DashboardActivityPropertySource['status'],
): DashboardActivityPropertySource => ({
  id: 'imovel-1',
  title: 'Casa',
  price: 1500,
  status,
  address: null,
})

describe('toVisibleActivityProperty', () => {
  it('devolve o resumo do imóvel publicado, sem o status', () => {
    expect(toVisibleActivityProperty(source('PUBLISHED'))).toEqual({
      id: 'imovel-1',
      title: 'Casa',
      price: 1500,
      address: null,
    })
  })

  it.each(['DRAFT', 'RENTED', 'SOLD', 'INACTIVE'] as const)('esconde o imóvel %s', (status) => {
    expect(toVisibleActivityProperty(source(status))).toBeNull()
  })

  it('devolve null quando o evento não tem imóvel', () => {
    expect(toVisibleActivityProperty(null)).toBeNull()
  })
})
