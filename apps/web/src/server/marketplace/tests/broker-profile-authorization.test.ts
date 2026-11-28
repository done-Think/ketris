import { describe, expect, it } from 'vitest'

import { assertBrokerProfileAccess } from '../application/authorization'

describe('assertBrokerProfileAccess', () => {
  it('allows a team broker and a solo broker', () => {
    expect(() => assertBrokerProfileAccess('AGENT')).not.toThrow()
    expect(() => assertBrokerProfileAccess('OWNER', 'BROKER')).not.toThrow()
  })

  it.each([
    ['OWNER', 'AGENCY'],
    ['OWNER', 'INDIVIDUAL'],
    ['OWNER', undefined],
    ['RENTER', 'BROKER'],
    ['PROPERTY_OWNER', 'BROKER'],
  ] as const)('refuses %s on a %s account', (role, accountType) => {
    expect(() => assertBrokerProfileAccess(role, accountType)).toThrow()
  })
})
