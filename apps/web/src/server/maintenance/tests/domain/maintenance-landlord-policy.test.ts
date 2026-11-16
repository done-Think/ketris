import { describe, expect, it } from 'vitest'
import {
  assertTicketAdmin,
  canAccessContract,
  canAccessTicket,
  permissionsFor,
} from '../../domain/maintenance-policy'
import { actor, admin, contract, ticket } from '../fixtures/maintenance-ticket'

const landlord = actor('OWNER', 'landlord', 'landlord-tenant')
const linkedTicket = { ...ticket, access: { ...ticket.access, landlordIds: ['landlord'] } }
const linkedContract = { ...contract, landlordIds: ['landlord'] }

describe('dono do imóvel vinculado como Locador nos chamados da imobiliária', () => {
  it('acessa o contrato e o chamado só quando está vinculado', () => {
    expect(canAccessContract(landlord, contract)).toBe(false)
    expect(canAccessTicket(landlord, ticket)).toBe(false)
    expect(canAccessContract(landlord, linkedContract)).toBe(true)
    expect(canAccessTicket(landlord, linkedTicket)).toBe(true)
  })

  it('só comenta: não administra, não agenda e não escolhe prestador', () => {
    expect(permissionsFor(landlord, linkedTicket)).toMatchObject({
      comment: true,
      linkContract: false,
      assign: false,
      provider: false,
      schedule: false,
      cancel: false,
      delete: false,
      edit: false,
    })
    expect(() => assertTicketAdmin(landlord, linkedTicket)).toThrow()
    expect(() => assertTicketAdmin(admin, ticket)).not.toThrow()
  })

  it('não acessa chamado arquivado nem de contrato inválido', () => {
    expect(canAccessTicket(landlord, { ...linkedTicket, deletedAt: new Date() })).toBe(false)
    expect(
      canAccessTicket(landlord, {
        ...linkedTicket,
        access: { ...linkedTicket.access, validContract: false },
      }),
    ).toBe(false)
  })
})
