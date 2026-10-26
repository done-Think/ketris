import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { resolveDashboardScope } from '../../domain/dashboard-scope'

const actor = { actorTenantId: 'tenant-1', actorId: 'user-1' }

describe('resolveDashboardScope', () => {
  it('OWNER vê a imobiliária inteira', () => {
    expect(resolveDashboardScope({ ...actor, actorPapel: 'OWNER' })).toEqual({
      tenantId: 'tenant-1',
      agentId: null,
    })
  })

  it('AGENT vê só o próprio trabalho', () => {
    expect(resolveDashboardScope({ ...actor, actorPapel: 'AGENT' })).toEqual({
      tenantId: 'tenant-1',
      agentId: 'user-1',
    })
  })

  it.each(['RENTER', 'PROPERTY_OWNER'] as const)('%s não acessa o dashboard', (actorPapel) => {
    expect(() => resolveDashboardScope({ ...actor, actorPapel })).toThrow(ForbiddenError)
  })
})
