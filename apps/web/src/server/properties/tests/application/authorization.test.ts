import { describe, expect, it } from 'vitest'

import { assertPropertyAccess } from '../../application/authorization'
import { PropertyNotFoundError } from '../../domain/errors'

describe('assertPropertyAccess', () => {
  it('não restringe ADMIN nem OWNER, mesmo sem ser o responsável', () => {
    expect(() => assertPropertyAccess('outro-usuario', 'actor-1', 'ADMIN')).not.toThrow()
    expect(() => assertPropertyAccess('outro-usuario', 'actor-1', 'OWNER')).not.toThrow()
  })

  it('libera o AGENT quando ele é o responsável pelo imóvel', () => {
    expect(() => assertPropertyAccess('actor-1', 'actor-1', 'AGENT')).not.toThrow()
  })

  it('bloqueia o AGENT quando ele não é o responsável pelo imóvel', () => {
    expect(() => assertPropertyAccess('outro-agente', 'actor-1', 'AGENT')).toThrow(
      PropertyNotFoundError,
    )
  })

  it('bloqueia um RENTER sempre, mesmo se por algum motivo ele fosse o responsável', () => {
    expect(() => assertPropertyAccess('actor-1', 'actor-1', 'RENTER')).toThrow(
      PropertyNotFoundError,
    )
  })
})
