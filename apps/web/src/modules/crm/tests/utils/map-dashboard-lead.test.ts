import { describe, expect, it, vi } from 'vitest'
import { toDashboardLead } from '../../utils/map-dashboard-lead'
import type { Lead } from '../../types/lead'

const lead: Lead = {
  id: 'lead',
  tenantId: 'agency',
  responsibleId: 'agent',
  name: 'Visitor',
  phone: '',
  email: 'visitor@example.test',
  interest: 'Property',
  budget: 'R$ 1.800,45',
  source: 'MARKETPLACE',
  stage: 'PROPOSAL',
  notes: null,
  opportunityId: 'opportunity',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('marketplace lead budget', () => {
  it.each([
    ['3500000000', 3500000000],
    ['3200.45', 3200.45],
    ['R$ 3.200,45', 3200.45],
    ['3.200,45', 3200.45],
    ['3.200', 3200],
    ['3200,45', 3200.45],
  ])('formats a manual numeric budget %s without changing its amount', (budget, amount) => {
    const money = vi.fn(() => 'Localized money')
    const result = toDashboardLead(
      { ...lead, budget, source: 'INSTAGRAM', opportunityId: null },
      'en-US',
      {
        money,
        relative: () => 'Recently',
        date: () => '',
        number: () => '',
      },
    )
    expect(money).toHaveBeenCalledWith(amount)
    expect(result.budget).toBe('Localized money')
  })
  it.each([
    ['pt-BR', 'R$ 3.200,45'],
    ['en-US', 'R$3,200.45'],
    ['es-ES', '3200,45 BRL'],
  ] as const)('formats stored numeric budgets in %s', (locale, expected) => {
    const result = toDashboardLead({ ...lead, budget: '3200.45' }, locale)
    expect(result.budget.replaceAll('\u00a0', ' ')).toBe(expected)
  })
  it.each(['A combinar', 'R$ 4.5M', 'Até R$ 2.000,45, a negociar', '', '3.20.00'])(
    'preserves legacy text %s',
    (budget) => {
      expect(toDashboardLead({ ...lead, budget }, 'pt-BR').budget).toBe(budget)
    },
  )
  it('passes the numeric proposal to the active locale formatter', () => {
    const money = vi.fn(() => 'Localized money')
    const result = toDashboardLead(lead, 'en-US', {
      money,
      relative: () => 'Recently',
      date: () => '',
      number: () => '',
    })
    expect(money).toHaveBeenCalledWith(1800.45)
    expect(result.budget).toBe('Localized money')
  })
  it('preserves manually entered budget conditions', () => {
    const money = vi.fn(() => 'Localized money')
    const result = toDashboardLead({ ...lead, budget: 'Até R$ 2.000,45, a negociar' }, 'pt-BR', {
      money,
      relative: () => 'Recentemente',
      date: () => '',
      number: () => '',
    })
    expect(result.budget).toBe('Até R$ 2.000,45, a negociar')
    expect(money).not.toHaveBeenCalled()
  })
})
