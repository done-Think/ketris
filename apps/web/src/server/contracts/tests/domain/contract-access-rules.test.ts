import { describe, expect, it } from 'vitest'

import type { Papel } from '@server/auth/domain/user.entity'

import { resolveContractAccessScope } from '../../domain/contract-access-rules'
import { ContractRenterForbiddenError } from '../../domain/errors'

describe('resolveContractAccessScope', () => {
  it.each(['ADMIN', 'OWNER'] as const)('libera todos os contratos do tenant para %s', (papel) => {
    expect(resolveContractAccessScope('user-1', papel)).toEqual({})
  })

  it('limita o AGENT aos contratos dos imóveis pelos quais ele é responsável', () => {
    expect(resolveContractAccessScope('agent-1', 'AGENT')).toEqual({ responsibleId: 'agent-1' })
  })

  it('bloqueia com 403 um papel desconhecido, em vez de liberar o tenant inteiro', () => {
    const unknownPapel = 'MANAGER' as unknown as Papel

    expect(() => resolveContractAccessScope('user-1', unknownPapel)).toThrow(
      expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
    )
    expect(() => resolveContractAccessScope('user-1', unknownPapel)).not.toThrow(
      ContractRenterForbiddenError,
    )
  })

  it('bloqueia RENTER com 403', () => {
    expect(() => resolveContractAccessScope('renter-1', 'RENTER')).toThrow(
      ContractRenterForbiddenError,
    )
    expect(() => resolveContractAccessScope('renter-1', 'RENTER')).toThrow(
      expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
    )
  })
})
