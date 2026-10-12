import { describe, expect, it } from 'vitest'

import {
  mapFinancialSummaryToKpis,
  mapMonthlySeriesToMovement,
  mapUpcomingChargesToDues,
} from '../utils/financial-summary-adapter'
import { convertFinancialAmount, formatFinancialAmount } from '../utils/financial-display-currency'

const euroRate = { currency: 'EUR' as const, brlPerUnit: 6, date: '2026-10-06' }
const dollarRate = { currency: 'USD' as const, brlPerUnit: 5, date: '2026-10-06' }

const series = [
  { year: 2026, month: 5, total: 100 },
  { year: 2026, month: 9, total: 200 },
  { year: 2026, month: 10, total: 300 },
]

describe('financial monthly movement labels', () => {
  it('uses the active locale without changing revenue values', () => {
    expect(mapMonthlySeriesToMovement(series, 'pt-BR')).toEqual([
      { month: 'mai', revenue: 100 },
      { month: 'set', revenue: 200 },
      { month: 'out', revenue: 300 },
    ])
    expect(mapMonthlySeriesToMovement(series, 'en-US').map(({ month }) => month)).toEqual([
      'May',
      'Sep',
      'Oct',
    ])
    expect(mapMonthlySeriesToMovement(series, 'es-ES').map(({ month }) => month)).toEqual([
      'may',
      'sept',
      'oct',
    ])
  })

  it('formats existing BRL amounts and percentages for the active locale', () => {
    const summary = {
      monthlyReceivable: 10500.5,
      overdueTotal: 2500,
      defaultRatePercentage: 12.5,
      monthlySeries: [],
      upcomingDues: [],
    }

    expect(mapFinancialSummaryToKpis(summary, 'pt-BR').map(({ value }) => value)).toEqual([
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(10500.5),
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(2500),
      '12,5%',
    ])
    expect(mapFinancialSummaryToKpis(summary, 'en-US').map(({ value }) => value)).toEqual([
      'R$10,500.50',
      'R$2,500.00',
      '12.5%',
    ])
    expect(mapFinancialSummaryToKpis(summary, 'es-ES').map(({ value }) => value)).toEqual([
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'BRL' }).format(10500.5),
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'BRL' }).format(2500),
      '12,5%',
    ])
  })

  it('converts BRL to EUR or USD for display without changing the source amounts', () => {
    const summary = {
      monthlyReceivable: 600,
      overdueTotal: 300,
      defaultRatePercentage: 12.5,
      monthlySeries: [],
      upcomingDues: [],
    }

    expect(mapFinancialSummaryToKpis(summary, 'es-ES', euroRate)[0].value).toBe(
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(100),
    )
    expect(mapFinancialSummaryToKpis(summary, 'en-US', dollarRate)[0].value).toBe('$120.00')
    expect(mapMonthlySeriesToMovement(series, 'es-ES', euroRate)[0].revenue).toBeCloseTo(100 / 6)
    expect(mapMonthlySeriesToMovement(series, 'en-US', dollarRate)[0].revenue).toBe(20)
    expect(summary.monthlyReceivable).toBe(600)
    expect(series[0].total).toBe(100)
  })

  it('keeps BRL when the quote is absent, mismatched, or invalid', () => {
    expect(convertFinancialAmount(600, 'es-ES', null)).toEqual({ amount: 600, currency: 'BRL' })
    expect(convertFinancialAmount(600, 'es-ES', dollarRate)).toEqual({
      amount: 600,
      currency: 'BRL',
    })
    expect(convertFinancialAmount(600, 'en-US', { ...dollarRate, brlPerUnit: 0 })).toEqual({
      amount: 600,
      currency: 'BRL',
    })
    expect(formatFinancialAmount(600, 'en-US', null)).toBe('R$600.00')
    expect(formatFinancialAmount(600, 'pt-BR', euroRate)).toBe('R$ 600,00')
  })

  it('localizes month abbreviations in upcoming due dates', () => {
    const dues = [
      {
        id: 'due-1',
        code: 'D-1',
        description: null,
        payerName: 'Client',
        propertyId: null,
        propertyTitle: 'Property',
        dueDate: '2026-10-15',
        amount: 100,
        status: 'PENDENTE' as const,
      },
    ]

    expect(mapUpcomingChargesToDues(dues, 'pt-BR')[0].dueDate).toBe('15/Out')
    expect(mapUpcomingChargesToDues(dues, 'en-US')[0].dueDate).toBe('15/Oct')
    expect(mapUpcomingChargesToDues(dues, 'es-ES')[0].dueDate).toBe('15/Oct')
  })
})
