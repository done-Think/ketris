import { describe, expect, it } from 'vitest'

import type { ApiAgencyOverviewKpis, ApiAgencyTopBroker } from '../../types/agency-service'
import {
  mapKpisToAgencyOverviewKpis,
  mapRevenueSeriesToAgencyRevenuePoints,
  mapTopBrokersToAgencyTopBrokers,
} from '../../utils/agency-overview-adapter'

const baseKpis: ApiAgencyOverviewKpis = {
  portfolioCount: 12,
  newPropertiesThisMonth: 0,
  activeBrokersCount: 4,
  receivedLeadsThisMonth: 7,
  receivedLeadsPreviousPeriod: 7,
  monthlyReceivable: 8500,
  monthlyReceivablePreviousMonth: 8500,
  overdueTotal: 0,
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

  it('destaca o valor em atraso só quando há cobranças vencidas', () => {
    expect(getKpi({ overdueTotal: 320 }, 'overdue')).toMatchObject({
      helper: { key: 'overdue' },
      tone: 'warning',
    })
    expect(normalize(getKpi({ overdueTotal: 320 }, 'overdue')?.value)).toBe('R$ 320,00')
    expect(getKpi({ overdueTotal: 0 }, 'overdue')).toMatchObject({
      helper: { key: 'noOverdue' },
      tone: 'neutral',
    })
  })
})

// Intl uses non-breaking spaces in currencies (e.g. "R$ 1,00"); normalize them for readable asserts.
const normalize = (value: string | undefined) => value?.replace(/\s/g, ' ')

describe('formatação por idioma', () => {
  const bigKpis: ApiAgencyOverviewKpis = {
    ...baseKpis,
    portfolioCount: 25000,
    activeBrokersCount: 1200,
    receivedLeadsThisMonth: 2500,
    monthlyReceivable: 9000,
  }
  const valuesOf = (...args: Parameters<typeof mapKpisToAgencyOverviewKpis>) =>
    Object.fromEntries(
      mapKpisToAgencyOverviewKpis(...args).map((kpi) => [kpi.id, normalize(kpi.value)]),
    )

  it('usa o separador de milhar de cada idioma nos números dos cards', () => {
    expect(valuesOf(bigKpis, 'pt-BR')).toMatchObject({
      portfolio: '25.000',
      brokers: '1.200',
      leads: '2.500',
      occupancy: '67%',
    })
    expect(valuesOf(bigKpis, 'en-US')).toMatchObject({
      portfolio: '25,000',
      brokers: '1,200',
      leads: '2,500',
    })
    // Spanish only groups numbers from five digits on (RAE/CLDR rule).
    expect(valuesOf(bigKpis, 'es-ES')).toMatchObject({ portfolio: '25.000', leads: '2500' })
  })

  it('mostra sempre reais, só mudando a formatação pelo idioma', () => {
    expect(valuesOf(bigKpis).revenue).toBe('R$ 9.000,00')
    expect(valuesOf(bigKpis, 'en-US').revenue).toBe('R$9,000.00')
    expect(valuesOf(bigKpis, 'es-ES').revenue).toMatch(/^9000,00\sBRL$/)
  })

  it('traduz os meses do gráfico sem converter os valores', () => {
    const series = [
      { year: 2026, month: 5, total: 600 },
      { year: 2026, month: 8, total: 1200 },
      { year: 2026, month: 10, total: 0 },
    ]

    expect(mapRevenueSeriesToAgencyRevenuePoints(series)).toEqual([
      { month: 'mai', revenue: 600 },
      { month: 'ago', revenue: 1200 },
      { month: 'out', revenue: 0 },
    ])
    expect(mapRevenueSeriesToAgencyRevenuePoints(series, 'es-ES')).toEqual([
      { month: 'may', revenue: 600 },
      { month: 'ago', revenue: 1200 },
      { month: 'oct', revenue: 0 },
    ])
    expect(
      mapRevenueSeriesToAgencyRevenuePoints(series, 'en-US').map(({ month }) => month),
    ).toEqual(['May', 'Aug', 'Oct'])
  })

  it('mostra os valores dos corretores destaque em reais em qualquer idioma', () => {
    const broker: ApiAgencyTopBroker = {
      id: 'broker-1',
      name: 'Marina Souza',
      avatarUrl: null,
      hasPublicProfile: true,
      salesCount: 1,
      revenueTotal: 12000,
      recentSales: [
        {
          id: 'contract-1',
          propertyId: 'property-1',
          propertyTitle: 'Apartamento Batel',
          location: 'Batel, Curitiba',
          value: 6000,
          closedAt: '2026-09-20T00:00:00.000Z',
        },
      ],
    }

    const [ptBroker] = mapTopBrokersToAgencyTopBrokers([broker])
    expect(normalize(ptBroker.revenue)).toBe('R$ 12.000,00')
    expect(normalize(ptBroker.recentSales[0].value)).toBe('R$ 6.000,00')

    const [esBroker] = mapTopBrokersToAgencyTopBrokers([broker], 'es-ES')
    expect(normalize(esBroker.revenue)).toBe('12.000,00 BRL')
    expect(normalize(esBroker.recentSales[0].value)).toBe('6000,00 BRL')
  })
})
