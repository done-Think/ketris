import { describe, expect, it } from 'vitest'

import {
  groupStatusChangesByTenant,
  statusAt,
  type TenantStatusChange,
} from '../../domain/tenant-status-history'

const tenant = { status: 'ACTIVE' as const, createdAt: new Date('2026-01-10T12:00:00.000Z') }

const changes: TenantStatusChange[] = [
  {
    tenantId: 't1',
    fromStatus: 'CANCELED',
    toStatus: 'ACTIVE',
    changedAt: new Date('2026-10-08T12:00:00.000Z'),
  },
  {
    tenantId: 't1',
    fromStatus: 'TRIAL',
    toStatus: 'CANCELED',
    changedAt: new Date('2026-09-20T12:00:00.000Z'),
  },
]

describe('statusAt', () => {
  it('devolve null antes da criação e no exato instante da criação', () => {
    expect(statusAt(tenant, [], new Date('2026-01-01T00:00:00.000Z'))).toBeNull()
    expect(statusAt(tenant, [], tenant.createdAt)).toBeNull()
  })

  it('sem histórico, a situação atual vale desde a criação', () => {
    expect(statusAt(tenant, [], new Date('2026-03-01T00:00:00.000Z'))).toBe('ACTIVE')
  })

  it('antes da primeira troca, vale a situação de origem dela', () => {
    expect(statusAt(tenant, changes, new Date('2026-09-01T00:00:00.000Z'))).toBe('TRIAL')
  })

  it('aplica as trocas anteriores ao instante, mesmo fora de ordem', () => {
    expect(statusAt(tenant, changes, new Date('2026-10-01T00:00:00.000Z'))).toBe('CANCELED')
    expect(statusAt(tenant, changes, new Date('2026-11-01T00:00:00.000Z'))).toBe('ACTIVE')
  })

  it('uma troca exatamente no instante ainda não vale', () => {
    expect(statusAt(tenant, changes, new Date('2026-10-08T12:00:00.000Z'))).toBe('CANCELED')
    expect(statusAt(tenant, changes, new Date('2026-10-08T12:00:00.001Z'))).toBe('ACTIVE')
  })
})

describe('groupStatusChangesByTenant', () => {
  it('agrupa por tenant mantendo a ordem recebida', () => {
    const other: TenantStatusChange = { ...changes[0], tenantId: 't2' }
    const grouped = groupStatusChangesByTenant([changes[0], other, changes[1]])

    expect([...grouped.keys()]).toEqual(['t1', 't2'])
    expect(grouped.get('t1')).toEqual([changes[0], changes[1]])
    expect(grouped.get('t2')).toEqual([other])
  })
})
