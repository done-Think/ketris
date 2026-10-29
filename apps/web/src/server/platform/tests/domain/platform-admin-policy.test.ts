import { describe, expect, it } from 'vitest'

import { LastPlatformAdminError } from '../../domain/errors'
import { assertActiveAdministratorRemains } from '../../domain/platform-admin-policy'

describe('active platform administrator invariant', () => {
  it.each([{ role: 'AGENT' as const }, { role: 'ADMIN_AGENT' as const }, { active: false }])(
    'rejects removing the last active administrator with %j',
    (change) => {
      expect(() =>
        assertActiveAdministratorRemains({ role: 'ADMIN', active: true }, change, 1),
      ).toThrow(LastPlatformAdminError)
    },
  )

  it('allows demotion when another active administrator remains', () => {
    expect(() =>
      assertActiveAdministratorRemains({ role: 'ADMIN', active: true }, { role: 'AGENT' }, 2),
    ).not.toThrow()
  })

  it('allows editing the last administrator without removing its role', () => {
    expect(() =>
      assertActiveAdministratorRemains({ role: 'ADMIN', active: true }, {}, 1),
    ).not.toThrow()
  })

  it('does not count an inactive administrator as an active manager', () => {
    expect(() =>
      assertActiveAdministratorRemains({ role: 'ADMIN', active: false }, { role: 'AGENT' }, 0),
    ).not.toThrow()
  })
})
