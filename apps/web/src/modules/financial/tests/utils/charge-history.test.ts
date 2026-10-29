import { describe, expect, it } from 'vitest'

import { mapHistoryEventFromApi } from '../../utils/charge-adapter'
import { normalizeChargeHistoryFields } from '../../utils/charge-history'
import { auditEvent } from '../fixtures/charge'

describe('charge history compatibility', () => {
  it('reads legacy, English and mixed arrays without changing stored order or values', () => {
    const fields = Object.freeze([
      'descricao',
      'description',
      'tipo',
      'type',
      'valor',
      'amount',
      'vencimento',
      'dueDate',
      'campo futuro',
      '__proto__',
    ])

    expect(normalizeChargeHistoryFields(fields)).toEqual([
      'description',
      'description',
      'type',
      'type',
      'amount',
      'amount',
      'dueDate',
      'dueDate',
      'campo futuro',
      '__proto__',
    ])
    expect(fields[0]).toBe('descricao')
    expect(normalizeChargeHistoryFields([])).toEqual([])
  })

  it('normalizes the response for presentation while retaining the raw audit event', () => {
    const event = auditEvent({
      action: 'UPDATED',
      changedFields: ['descricao', 'amount', 'desconhecido'],
      reason: 'description e RESOLVIDO são texto livre',
    })
    const stored = JSON.stringify(event)

    expect(mapHistoryEventFromApi(event)).toMatchObject({
      changedFields: ['description', 'amount', 'desconhecido'],
      reason: event.reason,
    })
    expect(JSON.stringify(event)).toBe(stored)
  })
})
