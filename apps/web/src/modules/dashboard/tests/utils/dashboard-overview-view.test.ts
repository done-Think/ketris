import { describe, expect, it } from 'vitest'

import { toDashboardOverviewView } from '../../utils/dashboard-overview-view'
import { apiDashboardOverview } from '../fixtures/dashboard'

describe('toDashboardOverviewView', () => {
  it('mantém as métricas e converte leads e atividades para a tela', () => {
    const view = toDashboardOverviewView(apiDashboardOverview)

    expect(view.metrics).toBe(apiDashboardOverview.metrics)
    expect(view.recentLeads).toEqual([
      expect.objectContaining({ name: 'Carlos Lima', status: 'new' }),
    ])
    expect(view.upcomingActivities).toEqual([
      expect.objectContaining({ title: 'Visita ao apartamento Batel', accent: 'magenta' }),
    ])
  })
})
