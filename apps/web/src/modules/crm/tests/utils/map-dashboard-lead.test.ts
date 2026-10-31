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
