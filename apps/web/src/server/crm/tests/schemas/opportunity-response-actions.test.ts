import { describe, expect, it } from 'vitest'

import { crmSystemActionKey } from '../../constants/translation-keys'
import { respondOpportunityRequestSchema } from '../../schemas/respond-opportunity.schema'

const cases = [
  ['ACEITAR', 'ACCEPT', 'accepted'],
  ['RECUSAR', 'REJECT', 'rejected'],
  ['SOLICITAR_INFORMACOES', 'REQUEST_INFORMATION', 'informationRequested'],
] as const

describe('canonical opportunity responses and history compatibility', () => {
  it.each(cases)('rejects %s and accepts %s while retaining human text', (legacy, action) => {
    const message = `Texto livre: ${legacy}. Não deve ser traduzido.`
    expect(respondOpportunityRequestSchema.parse({ action, message })).toEqual({ action, message })
    expect(respondOpportunityRequestSchema.safeParse({ action: legacy, message }).success).toBe(
      false,
    )
  })

  it.each(cases)(
    'presents historical %s and new %s with the same translation',
    (legacy, action, key) => {
      const historical = { systemAction: legacy, description: 'Conversa original' }
      const snapshot = JSON.stringify(historical)
      expect(crmSystemActionKey(historical.systemAction)).toBe(key)
      expect(crmSystemActionKey(action)).toBe(key)
      expect(JSON.stringify(historical)).toBe(snapshot)
    },
  )

  it.each(['', 'accept', 'aceitar', 'toString', '__proto__', 'UNKNOWN', null, 1])(
    'rejects unknown actions: %s',
    (action) => {
      expect(respondOpportunityRequestSchema.safeParse({ action }).success).toBe(false)
    },
  )

  it('preserves the fallback for unrelated history and other system actions', () => {
    expect(crmSystemActionKey('OPPORTUNITY_CREATED')).toBe('opportunityCreated')
    expect(crmSystemActionKey('unknown-action')).toBeNull()
    expect(crmSystemActionKey(null)).toBeNull()
    expect(crmSystemActionKey(undefined)).toBeNull()
  })
})
