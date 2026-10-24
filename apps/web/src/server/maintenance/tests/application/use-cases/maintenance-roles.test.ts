import { describe, expect, it } from 'vitest'

import {
  canAccessContract,
  canAccessTicket,
  permissionsFor,
} from '../../../application/authorization'
import { actor, contract, ticket } from '../../fixtures/maintenance-ticket'

describe('Maintenance roles', () => {
  it('trata o dono da imobiliária (OWNER) como gestor do tenant', () => {
    const agencyOwner = actor('OWNER', 'agency-owner')

    expect(canAccessContract(agencyOwner, contract)).toBe(true)
    expect(canAccessTicket(agencyOwner, ticket)).toBe(true)
    expect(permissionsFor(agencyOwner, ticket)).toMatchObject({
      assign: true,
      cancel: true,
      delete: true,
      linkContract: true,
    })
  })

  it('não dá ao dono da imobiliária acesso a outro tenant', () => {
    const otherAgencyOwner = actor('OWNER', 'agency-owner', 'tenant-2')

    expect(canAccessContract(otherAgencyOwner, contract)).toBe(false)
    expect(canAccessTicket(otherAgencyOwner, ticket)).toBe(false)
  })

  it('restringe o proprietário do imóvel (PROPERTY_OWNER) ao próprio vínculo', () => {
    const linkedOwner = actor('PROPERTY_OWNER', 'owner')
    const unrelatedOwner = actor('PROPERTY_OWNER', 'someone-else')

    expect(canAccessTicket(linkedOwner, ticket)).toBe(true)
    expect(canAccessTicket(unrelatedOwner, ticket)).toBe(false)
    expect(permissionsFor(linkedOwner, ticket)).toMatchObject({
      assign: false,
      cancel: false,
      delete: false,
      linkContract: false,
    })
  })
})
