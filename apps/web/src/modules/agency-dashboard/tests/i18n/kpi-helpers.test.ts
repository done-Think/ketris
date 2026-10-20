import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import ptDashboard from '@/i18n/messages/pt-BR/dashboard.json'
import enDashboard from '@/i18n/messages/en-US/dashboard.json'
import esDashboard from '@/i18n/messages/es-ES/dashboard.json'

import type { ApiAgencyOverviewKpis } from '../../types/service'
import { mapKpisToAgencyOverviewKpis } from '../../utils/agency-overview-adapter'

const catalogs = {
  'pt-BR': { dashboard: ptDashboard },
  'en-US': { dashboard: enDashboard },
  'es-ES': { dashboard: esDashboard },
} as const

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

// One scenario per helper the adapter can produce, so every key is resolved in every locale.
const scenarios: Partial<ApiAgencyOverviewKpis>[] = [
  { newPropertiesThisMonth: 0 },
  { newPropertiesThisMonth: 1 },
  { newPropertiesThisMonth: 3 },
  { receivedLeadsThisMonth: 9, receivedLeadsPreviousPeriod: 4 },
  { receivedLeadsThisMonth: 2, receivedLeadsPreviousPeriod: 5 },
  { monthlyReceivable: 11200, monthlyReceivablePreviousMonth: 10000 },
  { monthlyReceivable: 9200, monthlyReceivablePreviousMonth: 10000 },
  { monthlyReceivable: 5000, monthlyReceivablePreviousMonth: 0 },
]

type HelperKey = keyof typeof ptDashboard.agencyOverview.kpis.helpers

function renderHelpers(locale: keyof typeof catalogs) {
  const t = createTranslator({
    locale,
    messages: catalogs[locale],
    namespace: 'dashboard.agencyOverview.kpis.helpers',
  })

  return scenarios.flatMap((scenario) =>
    mapKpisToAgencyOverviewKpis({ ...baseKpis, ...scenario }).flatMap((kpi) =>
      kpi.helper ? [t(kpi.helper.key as HelperKey, kpi.helper.values)] : [],
    ),
  )
}

describe('KPI helpers i18n', () => {
  it.each(['pt-BR', 'en-US', 'es-ES'] as const)(
    'resolve todas as frases de comparação em %s sem chaves ou placeholders sobrando',
    (locale) => {
      const helpers = renderHelpers(locale)

      expect(helpers.length).toBeGreaterThan(0)
      for (const helper of helpers) {
        expect(helper).not.toMatch(/[{}]|helpers\./)
      }
    },
  )

  it('tem as mesmas frases de comparação nos três idiomas', () => {
    const keys = Object.keys(ptDashboard.agencyOverview.kpis.helpers).sort()

    expect(Object.keys(enDashboard.agencyOverview.kpis.helpers).sort()).toEqual(keys)
    expect(Object.keys(esDashboard.agencyOverview.kpis.helpers).sort()).toEqual(keys)
  })

  it('formata números grandes com o separador de milhar de cada idioma', () => {
    const translate = (
      locale: keyof typeof catalogs,
      key: 'leadsIncrease' | 'revenueIncrease' | 'newProperties',
      values: Record<string, number>,
    ) =>
      createTranslator({
        locale,
        messages: catalogs[locale],
        namespace: 'dashboard.agencyOverview.kpis.helpers',
      })(key, values)

    expect(translate('pt-BR', 'leadsIncrease', { count: 1500 })).toBe('+1.500 vs mês passado')
    expect(translate('pt-BR', 'revenueIncrease', { percent: 1400 })).toBe('+1.400% vs mês passado')
    expect(translate('pt-BR', 'newProperties', { count: 1200 })).toBe('+1.200 novos este mês')
    expect(translate('en-US', 'leadsIncrease', { count: 1500 })).toBe('+1,500 vs last month')
    expect(translate('es-ES', 'leadsIncrease', { count: 15000 })).toBe('+15.000 vs mes anterior')
  })

  it('usa singular e plural corretos nos imóveis novos', () => {
    const translate = (locale: keyof typeof catalogs, count: number) =>
      createTranslator({
        locale,
        messages: catalogs[locale],
        namespace: 'dashboard.agencyOverview.kpis',
      })('helpers.newProperties', { count })

    expect(translate('pt-BR', 1)).toBe('+1 novo este mês')
    expect(translate('pt-BR', 2)).toBe('+2 novos este mês')
    expect(translate('en-US', 1)).toBe('+1 new this month')
    expect(translate('en-US', 0)).toBe('None new this month')
    expect(translate('es-ES', 1)).toBe('+1 nuevo este mes')
    expect(translate('es-ES', 2)).toBe('+2 nuevos este mes')
  })
})
