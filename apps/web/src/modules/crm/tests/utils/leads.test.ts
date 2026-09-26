import { describe, expect, it } from 'vitest'

import type { DashboardLead } from '../../types/lead'
import { sortLeads } from '../../utils/leads'

function makeDashboardLead(overrides: Partial<DashboardLead> = {}): DashboardLead {
  return {
    id: 'lead-1',
    name: 'Lead',
    budget: 'R$ 1M',
    phone: '(11) 90000-0000',
    email: 'lead@email.com',
    lastContact: 'agora',
    lastContactAt: '2026-09-01T10:00:00.000Z',
    interest: 'Apartamento',
    source: 'Marketplace',
    broker: '',
    stage: 'Novo',
    opportunityId: null,
    ...overrides,
  }
}

describe('sortLeads', () => {
  it('ordena orçamentos no formato brasileiro (separador de milhar) corretamente', () => {
    const leads = [
      makeDashboardLead({ id: 'a', budget: 'R$ 1.850.000' }),
      makeDashboardLead({ id: 'b', budget: 'Até R$ 8.000' }),
      makeDashboardLead({ id: 'c', budget: 'R$ 3.200' }),
    ]

    const sorted = sortLeads(leads, { field: 'budget', direction: 'asc' })

    expect(sorted.map((lead) => lead.id)).toEqual(['c', 'b', 'a'])
  })

  it('continua ordenando corretamente orçamentos abreviados (K/M)', () => {
    const leads = [
      makeDashboardLead({ id: 'a', budget: 'R$ 1M' }),
      makeDashboardLead({ id: 'b', budget: 'R$ 300K' }),
      makeDashboardLead({ id: 'c', budget: 'R$ 1.5M' }),
    ]

    const sorted = sortLeads(leads, { field: 'budget', direction: 'asc' })

    expect(sorted.map((lead) => lead.id)).toEqual(['b', 'a', 'c'])
  })

  it('não confunde sufixo de mês ("/mês") com abreviação de milhão', () => {
    const leads = [
      makeDashboardLead({ id: 'a', budget: 'R$ 4.500/mês' }),
      makeDashboardLead({ id: 'b', budget: 'R$ 800/mês' }),
    ]

    const sorted = sortLeads(leads, { field: 'budget', direction: 'asc' })

    expect(sorted.map((lead) => lead.id)).toEqual(['b', 'a'])
  })

  it('ordena estágio pela ordem do funil, não alfabeticamente', () => {
    const leads = [
      makeDashboardLead({ id: 'a', stage: 'Proposta' }),
      makeDashboardLead({ id: 'b', stage: 'Novo' }),
      makeDashboardLead({ id: 'c', stage: 'Em contato' }),
      makeDashboardLead({ id: 'd', stage: 'Visita marcada' }),
    ]

    const sorted = sortLeads(leads, { field: 'stage', direction: 'asc' })

    expect(sorted.map((lead) => lead.id)).toEqual(['b', 'c', 'd', 'a'])
  })

  it('ordena último contato cronologicamente, não pelo texto exibido', () => {
    const leads = [
      makeDashboardLead({
        id: 'a',
        lastContact: '1 semana atrás',
        lastContactAt: '2026-08-25T10:00:00.000Z',
      }),
      makeDashboardLead({
        id: 'b',
        lastContact: 'Há 2 horas',
        lastContactAt: '2026-09-01T08:00:00.000Z',
      }),
      makeDashboardLead({
        id: 'c',
        lastContact: 'Ontem',
        lastContactAt: '2026-08-31T10:00:00.000Z',
      }),
    ]

    const sorted = sortLeads(leads, { field: 'lastContact', direction: 'desc' })

    expect(sorted.map((lead) => lead.id)).toEqual(['b', 'c', 'a'])
  })
})
