import { describe, expect, it } from 'vitest'

import { resolveChargeReadScope } from '../../application/charge-read-scope'

describe('resolveChargeReadScope', () => {
  it('libera o tenant inteiro para o OWNER', () => {
    expect(
      resolveChargeReadScope({
        actorId: 'owner-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'OWNER',
      }),
    ).toEqual({ kind: 'tenant', tenantId: 'tenant-1' })
  })

  it('limita o RENTER às cobranças dos contratos dele', () => {
    expect(
      resolveChargeReadScope({
        actorId: 'renter-1',
        actorTenantId: 'renters',
        actorPapel: 'RENTER',
      }),
    ).toEqual({ kind: 'renter', userId: 'renter-1' })
  })

  it('limita o PROPERTY_OWNER às cobranças e repasses dos imóveis dele', () => {
    expect(
      resolveChargeReadScope({
        actorId: 'owner-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'PROPERTY_OWNER',
      }),
    ).toEqual({ kind: 'propertyOwner', tenantId: 'tenant-1', ownerId: 'owner-1' })
  })

  it('bloqueia o AGENT', () => {
    expect(() =>
      resolveChargeReadScope({
        actorId: 'agent-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
      }),
    ).toThrow(expect.objectContaining({ status: 403 }))
  })
})
