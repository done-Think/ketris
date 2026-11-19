import { describe, expect, it } from 'vitest'

import type { ChargeListRow } from '../../types/charge'
import {
  calendarDayKey,
  groupContractChargesByMonth,
  summarizeContractCharges,
} from '../../utils/contract-charges'

function row(overrides: Partial<ChargeListRow>): ChargeListRow {
  return {
    id: 'charge',
    tenantId: 'agency',
    code: 'COB-2026-0001',
    contractId: 'contract-1',
    direction: 'receivable',
    description: null,
    payer: 'Lara',
    property: 'Apto',
    amount: 1000,
    dueDate: '2026-01-10',
    status: 'pending',
    receipt: null,
    ...overrides,
  }
}

const today = new Date(2026, 0, 15)

describe('groupContractChargesByMonth', () => {
  it('groups by due month, newest month first, with total and status per month', () => {
    const months = groupContractChargesByMonth([
      row({ id: 'jan-rent', dueDate: '2026-01-10', status: 'overdue', amount: 2800 }),
      row({ id: 'nov-rent', dueDate: '2025-11-10', status: 'paid', amount: 2800 }),
      row({ id: 'jan-iptu', dueDate: '2026-01-05', status: 'paid', amount: 200 }),
      row({ id: 'feb-rent', dueDate: '2026-02-10', status: 'pending', amount: 2800 }),
      row({ id: 'feb-fee', dueDate: '2026-02-12', status: 'cancelled', amount: 50 }),
      row({ id: 'dec-old', dueDate: '2025-12-10', status: 'cancelled', amount: 10 }),
    ])

    expect(months.map(({ month, status, total }) => ({ month, status, total }))).toEqual([
      { month: '2026-02', status: 'upcoming', total: 2800 },
      { month: '2026-01', status: 'overdue', total: 3000 },
      { month: '2025-12', status: 'cancelled', total: 0 },
      { month: '2025-11', status: 'paid', total: 2800 },
    ])
    expect(months[1].charges.map((charge) => charge.id)).toEqual(['jan-iptu', 'jan-rent'])
  })
})

describe('summarizeContractCharges', () => {
  it('counts open and overdue charges and finds the ones due within 3 days', () => {
    const overview = summarizeContractCharges(
      [
        row({ id: 'late', dueDate: '2026-01-05', status: 'overdue', amount: 500 }),
        row({ id: 'paid', dueDate: '2026-01-10', status: 'paid' }),
        row({ id: 'soon', dueDate: '2026-01-18', status: 'pending', amount: 700 }),
        row({ id: 'later', dueDate: '2026-01-19', status: 'scheduled', amount: 900 }),
      ],
      today,
    )

    expect(overview.openCount).toBe(3)
    expect(overview.openTotal).toBe(2100)
    expect(overview.overdue.map((charge) => charge.id)).toEqual(['late'])
    expect(overview.nextDue?.id).toBe('soon')
    expect(overview.dueSoon.map((charge) => charge.id)).toEqual(['soon'])
    expect(overview.dueSoonTotal).toBe(700)
  })

  it('formats the calendar day of the browser, crossing month boundaries', () => {
    expect(calendarDayKey(new Date(2026, 0, 30), 3)).toBe('2026-02-02')
  })
})
