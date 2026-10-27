import { describe, expect, it } from 'vitest'

import { buildDashboardMetrics } from '../../utils/build-dashboard-metrics'
import { toDashboardUpcomingActivity } from '../../utils/map-dashboard-activity'
import { toDashboardRecentLead } from '../../utils/map-dashboard-recent-lead'
import { apiDashboardOverview } from '../fixtures/dashboard'

const t = (key: string, values?: Record<string, string | number>) =>
  values ? `${key}:${JSON.stringify(values)}` : key

describe('buildDashboardMetrics', () => {
  const metrics = {
    activeLeads: 6,
    activeLeadsCreatedToday: 2,
    visitsThisMonth: 4,
    visitsToday: 1,
    openProposals: 3,
    proposalsAwaitingResponse: 0,
  }

  it('transforma as contagens da API nos três cards', () => {
    expect(buildDashboardMetrics({ metrics, t }).map((metric) => metric.value)).toEqual([
      '6',
      '4',
      '3',
    ])
  })

  it('destaca as propostas só quando há alguma aguardando resposta', () => {
    expect(buildDashboardMetrics({ metrics, t })[2].tone).toBe('success')
    expect(
      buildDashboardMetrics({ metrics: { ...metrics, proposalsAwaitingResponse: 2 }, t })[2].tone,
    ).toBe('danger')
  })
})

describe('mapeadores do dashboard', () => {
  it('converte o estágio do lead no status exibido', () => {
    expect(
      toDashboardRecentLead({
        id: 'lead-1',
        name: 'Carlos',
        phone: '1',
        interest: 'Apto',
        budget: 'R$ 1',
        source: 'SITE',
        stage: 'VISITA_MARCADA',
        notes: null,
        createdAt: '2026-10-20T12:00:00.000Z',
      }),
    ).toMatchObject({ status: 'qualified', notes: '' })
  })

  it('usa a cor padrão para atividade sem tipo', () => {
    expect(
      toDashboardUpcomingActivity({
        id: 'event-1',
        title: 'Reunião',
        kind: null,
        start: '2026-10-21T13:00:00.000Z',
        end: '2026-10-21T14:00:00.000Z',
        participantName: 'Ana',
        participantPhone: '1',
        notes: null,
        propertyId: null,
        propertyReference: null,
        property: null,
      }),
    ).toMatchObject({ accent: 'info', contact: 'Ana', notes: '', property: null })
  })

  it('monta o endereço do imóvel publicado em uma linha', () => {
    expect(
      toDashboardUpcomingActivity(apiDashboardOverview.upcomingActivities[0]).property,
    ).toEqual({
      title: 'Apartamento Batel',
      price: 3200,
      address: 'Rua Bispo, 10 - Batel, Curitiba',
    })
    expect(
      toDashboardUpcomingActivity({
        ...apiDashboardOverview.upcomingActivities[0],
        property: { id: 'p', title: 'Sem endereço', price: 1, address: null },
      }).property,
    ).toEqual({ title: 'Sem endereço', price: 1, address: null })
  })
})
