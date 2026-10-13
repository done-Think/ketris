import { describe, expect, it } from 'vitest'

import type { ApiAgencyOverviewKpis } from '../../types/service'
import { mapKpisToAgencyOverviewKpis } from '../../utils/agency-overview-adapter'

const baseKpis: ApiAgencyOverviewKpis = {
  portfolioCount: 12,
  newPropertiesThisMonth: 0,
  activeBrokersCount: 4,
  receivedLeadsThisMonth: 7,
  receivedLeadsPreviousPeriod: 7,
  monthlyReceivable: 8500,
  monthlyReceivablePreviousMonth: 8500,
  occupancyPercentage: 67,
}

function getKpi(overrides: Partial<ApiAgencyOverviewKpis>, id: string) {
  return mapKpisToAgencyOverviewKpis({ ...baseKpis, ...overrides }).find((kpi) => kpi.id === id)
}

describe('mapKpisToAgencyOverviewKpis', () => {
  it('mostra os imóveis novos do mês na carteira, em verde quando há algum', () => {
    expect(getKpi({ newPropertiesThisMonth: 3 }, 'portfolio')).toMatchObject({
      helper: { key: 'newProperties', values: { count: 3 } },
      tone: 'success',
    })
    expect(getKpi({ newPropertiesThisMonth: 0 }, 'portfolio')).toMatchObject({
      helper: { key: 'newProperties', values: { count: 0 } },
      tone: 'neutral',
    })
  })

  it('compara os leads com o mesmo trecho do mês anterior pela diferença absoluta', () => {
    expect(
      getKpi({ receivedLeadsThisMonth: 9, receivedLeadsPreviousPeriod: 4 }, 'leads'),
    ).toMatchObject({
      helper: { key: 'leadsIncrease', values: { count: 5 } },
      tone: 'success',
    })
    expect(
      getKpi({ receivedLeadsThisMonth: 2, receivedLeadsPreviousPeriod: 5 }, 'leads'),
    ).toMatchObject({
      helper: { key: 'leadsDecrease', values: { count: 3 } },
      tone: 'neutral',
    })
    expect(
      getKpi({ receivedLeadsThisMonth: 4, receivedLeadsPreviousPeriod: 4 }, 'leads'),
    ).toMatchObject({
      helper: { key: 'leadsSame' },
      tone: 'neutral',
    })
  })

  it('compara o faturamento com o mês anterior em percentual arredondado', () => {
    expect(
      getKpi({ monthlyReceivable: 11200, monthlyReceivablePreviousMonth: 10000 }, 'revenue'),
    ).toMatchObject({
      helper: { key: 'revenueIncrease', values: { percent: 12 } },
      tone: 'success',
    })
    expect(
      getKpi({ monthlyReceivable: 9200, monthlyReceivablePreviousMonth: 10000 }, 'revenue'),
    ).toMatchObject({ helper: { key: 'revenueDecrease', values: { percent: 8 } }, tone: 'neutral' })
    expect(
      getKpi({ monthlyReceivable: 10020, monthlyReceivablePreviousMonth: 10000 }, 'revenue'),
    ).toMatchObject({ helper: { key: 'revenueSame' }, tone: 'neutral' })
  })

  it('compara leads quando um dos períodos está zerado', () => {
    expect(
      getKpi({ receivedLeadsThisMonth: 5, receivedLeadsPreviousPeriod: 0 }, 'leads'),
    ).toMatchObject({ helper: { key: 'leadsIncrease', values: { count: 5 } }, tone: 'success' })
    expect(
      getKpi({ receivedLeadsThisMonth: 0, receivedLeadsPreviousPeriod: 3 }, 'leads'),
    ).toMatchObject({ helper: { key: 'leadsDecrease', values: { count: 3 } }, tone: 'neutral' })
    expect(
      getKpi({ receivedLeadsThisMonth: 0, receivedLeadsPreviousPeriod: 0 }, 'leads'),
    ).toMatchObject({ helper: { key: 'leadsSame' }, tone: 'neutral' })
  })

  it('arredonda o percentual de faturamento de forma simétrica para alta e queda', () => {
    expect(
      getKpi({ monthlyReceivable: 10050, monthlyReceivablePreviousMonth: 10000 }, 'revenue'),
    ).toMatchObject({ helper: { key: 'revenueIncrease', values: { percent: 1 } } })
    expect(
      getKpi({ monthlyReceivable: 9950, monthlyReceivablePreviousMonth: 10000 }, 'revenue'),
    ).toMatchObject({ helper: { key: 'revenueDecrease', values: { percent: 1 } } })
    expect(
      getKpi({ monthlyReceivable: 10049, monthlyReceivablePreviousMonth: 10000 }, 'revenue'),
    ).toMatchObject({ helper: { key: 'revenueSame' } })
    expect(
      getKpi({ monthlyReceivable: 9951, monthlyReceivablePreviousMonth: 10000 }, 'revenue'),
    ).toMatchObject({ helper: { key: 'revenueSame' } })
  })

  it('mostra queda de 100% quando o faturamento do mês zera e altas acima de 100%', () => {
    expect(
      getKpi({ monthlyReceivable: 0, monthlyReceivablePreviousMonth: 1000 }, 'revenue'),
    ).toMatchObject({ helper: { key: 'revenueDecrease', values: { percent: 100 } } })
    expect(
      getKpi({ monthlyReceivable: 1500, monthlyReceivablePreviousMonth: 100 }, 'revenue'),
    ).toMatchObject({
      helper: { key: 'revenueIncrease', values: { percent: 1400 } },
      tone: 'success',
    })
  })

  it('compara faturamento com centavos sem gerar percentual quebrado', () => {
    expect(
      getKpi({ monthlyReceivable: 1234.56, monthlyReceivablePreviousMonth: 1000.01 }, 'revenue'),
    ).toMatchObject({ helper: { key: 'revenueIncrease', values: { percent: 23 } } })
  })

  it('não calcula percentual quando o mês anterior não teve faturamento', () => {
    expect(
      getKpi({ monthlyReceivable: 5000, monthlyReceivablePreviousMonth: 0 }, 'revenue'),
    ).toMatchObject({
      helper: { key: 'revenueNoPrevious' },
      tone: 'neutral',
    })
    expect(
      getKpi({ monthlyReceivable: 0, monthlyReceivablePreviousMonth: 0 }, 'revenue')?.helper,
    ).toBeUndefined()
  })

  it('não mostra comparação para corretores ativos nem ocupação', () => {
    expect(getKpi({}, 'brokers')?.helper).toBeUndefined()
    expect(getKpi({}, 'occupancy')?.helper).toBeUndefined()
  })
})
