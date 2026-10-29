import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { assertCanEditProperties, assertPropertyAccess } from '../../application/authorization'
import { PropertyNotFoundError } from '../../domain/errors'

const property = (responsibleId: string, ownerId: string | null = null) => ({
  responsibleId,
  ownerId,
})

describe('assertPropertyAccess', () => {
  it('não restringe o OWNER, mesmo sem ser o responsável', () => {
    expect(() => assertPropertyAccess(property('outro-usuario'), 'actor-1', 'OWNER')).not.toThrow()
  })

  it('libera o AGENT quando ele é o responsável pelo imóvel', () => {
    expect(() => assertPropertyAccess(property('actor-1'), 'actor-1', 'AGENT')).not.toThrow()
  })

  it('bloqueia o AGENT quando ele não é o responsável pelo imóvel', () => {
    expect(() => assertPropertyAccess(property('outro-agente'), 'actor-1', 'AGENT')).toThrow(
      PropertyNotFoundError,
    )
  })

  it('libera o PROPERTY_OWNER só no imóvel em que é o proprietário', () => {
    expect(() =>
      assertPropertyAccess(property('agente', 'actor-1'), 'actor-1', 'PROPERTY_OWNER'),
    ).not.toThrow()
    expect(() =>
      assertPropertyAccess(property('actor-1', 'outro-dono'), 'actor-1', 'PROPERTY_OWNER'),
    ).toThrow(PropertyNotFoundError)
  })

  it('bloqueia um RENTER sempre, mesmo se por algum motivo ele fosse o responsável', () => {
    expect(() => assertPropertyAccess(property('actor-1', 'actor-1'), 'actor-1', 'RENTER')).toThrow(
      PropertyNotFoundError,
    )
  })
})

describe('permissões de escrita em imóveis', () => {
  it.each(['OWNER', 'AGENT', 'PROPERTY_OWNER'] as const)(
    '%s cria, edita, publica e exclui',
    (role) => {
      expect(() => assertCanEditProperties(role)).not.toThrow()
    },
  )

  it('o RENTER não escreve em imóveis', () => {
    expect(() => assertCanEditProperties('RENTER')).toThrow(ForbiddenError)
  })
})
