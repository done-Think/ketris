import { describe, expect, it } from 'vitest'

import {
  mapChargeListItemToFinancialEntry,
  mapFinancialSummaryToKpis,
  mapMonthlySeriesToMovement,
  mapUpcomingChargesToDues,
} from '../../utils/financial-summary-adapter'
import { apiListItem, summary } from '../fixtures/charge'

describe('financial-summary-adapter', () => {
  it('returns no KPIs while the summary is loading', () => {
    expect(mapFinancialSummaryToKpis(undefined, String, String)).toEqual([])
  })

  it('maps the summary into the four KPI cards using the given formatters', () => {
    const kpis = mapFinancialSummaryToKpis(
      summary(),
      (value) => `R$ ${value}`,
      (value) => `${value}%`,
    )
    expect(kpis.map(({ id, value, tone }) => [id, value, tone])).toEqual([
      ['receivable', 'R$ 10500.5', 'info'],
      ['delinquency', 'R$ 2500', 'error'],
      ['defaultRate', '12.5%', 'warning'],
      ['occupancyRate', '64%', 'success'],
    ])
  })

  it('maps upcoming dues with fallbacks for standalone charges', () => {
    expect(
      mapUpcomingChargesToDues([
        {
          id: 'due-1',
          code: 'COB-2026-0002',
          description: 'IPTU',
          payerName: null,
          propertyId: null,
          propertyTitle: null,
          dueDate: '2026-10-20T00:00:00.000Z',
          amount: 300,
          status: 'SCHEDULED',
        },
      ]),
    ).toEqual([
      {
        id: 'due-1',
        property: 'IPTU',
        client: 'IPTU',
        dueDate: '2026-10-20',
        amountValue: 300,
        status: 'scheduled',
      },
    ])
  })

  it('shows payable entries as negative amounts', () => {
    expect(mapChargeListItemToFinancialEntry(apiListItem({ type: 'PAYABLE' }))).toMatchObject({
      amountValue: -2800,
      date: '2026-10-10',
      status: 'pending',
    })
    expect(
      mapChargeListItemToFinancialEntry(
        apiListItem({ description: null, payerName: null, propertyTitle: null }),
      ),
    ).toMatchObject({ description: 'COB-2026-0001', client: '—', property: '—' })
  })

  it('labels the monthly series with the month formatter, keeping BRL totals', () => {
    expect(
      mapMonthlySeriesToMovement(summary().monthlySeries, (year, month) => `${month}/${year}`),
    ).toEqual([
      { month: '9/2026', revenue: 8000 },
      { month: '10/2026', revenue: 10500.5 },
    ])
  })
})
