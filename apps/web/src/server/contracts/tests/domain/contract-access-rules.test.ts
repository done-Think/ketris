import { describe, expect, it } from 'vitest'
import type { UserRole } from '@server/auth/domain/user.entity'
import {
  resolveContractManageScope,
  resolveContractReadScope,
} from '../../domain/contract-access-rules'
import { ContractRenterForbiddenError } from '../../domain/errors'

describe('resolveContractManageScope', () => {
  it.each(['OWNER'] as const)('libera todos os contratos do tenant para %s', (role) => {
    expect(resolveContractManageScope('user-1', role)).toEqual({})
  })

  it('limita o AGENT aos contratos dos imóveis pelos quais ele é responsável', () => {
    expect(resolveContractManageScope('agent-1', 'AGENT')).toEqual({ responsibleId: 'agent-1' })
  })

  it('bloqueia com 403 um papel desconhecido, em vez de liberar o tenant inteiro', () => {
    const unknownRole = 'MANAGER' as unknown as UserRole

    expect(() => resolveContractManageScope('user-1', unknownRole)).toThrow(
      expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
    )
    expect(() => resolveContractManageScope('user-1', unknownRole)).not.toThrow(
      ContractRenterForbiddenError,
    )
  })

  it('bloqueia RENTER com 403', () => {
    expect(() => resolveContractManageScope('renter-1', 'RENTER')).toThrow(
      ContractRenterForbiddenError,
    )
    expect(() => resolveContractManageScope('renter-1', 'RENTER')).toThrow(
      expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
    )
  })
})

describe('resolveContractReadScope', () => {
  it.each(['OWNER'] as const)('libera a leitura do tenant inteiro para %s', (role) => {
    expect(resolveContractReadScope('tenant-1', 'user-1', role)).toEqual({
      kind: 'tenant',
      tenantId: 'tenant-1',
    })
  })

  it('limita a leitura do AGENT aos imóveis pelos quais ele é responsável', () => {
    expect(resolveContractReadScope('tenant-1', 'agent-1', 'AGENT')).toEqual({
      kind: 'tenant',
      tenantId: 'tenant-1',
      responsibleId: 'agent-1',
    })
  })

  it('limita o RENTER aos contratos em que ele é a parte vinculada, sem filtrar pelo tenant dele', () => {
    expect(resolveContractReadScope('locatarios', 'renter-1', 'RENTER')).toEqual({
      kind: 'party',
      userId: 'renter-1',
    })
  })

  it('limita o PROPERTY_OWNER aos contratos dos imóveis dele, só para leitura', () => {
    expect(resolveContractReadScope('tenant-1', 'owner-1', 'PROPERTY_OWNER')).toEqual({
      kind: 'propertyOwner',
      tenantId: 'tenant-1',
      ownerId: 'owner-1',
    })
    expect(() => resolveContractManageScope('owner-1', 'PROPERTY_OWNER')).toThrow(
      expect.objectContaining({ status: 403 }),
    )
  })

  it('bloqueia com 403 um papel desconhecido', () => {
    const unknownRole = 'MANAGER' as unknown as UserRole

    expect(() => resolveContractReadScope('tenant-1', 'user-1', unknownRole)).toThrow(
      expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
    )
  })
})
