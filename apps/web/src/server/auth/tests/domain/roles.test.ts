import { describe, expect, it } from 'vitest'

import { isAgencyManager, isAgencyStaff, isPropertyOwner } from '../../domain/roles'
import type { Papel } from '../../domain/user.entity'

const roles: Papel[] = ['OWNER', 'AGENT', 'RENTER', 'PROPERTY_OWNER']

describe('papéis de usuário', () => {
  it.each(roles)('classifica %s como gestor da imobiliária só quando é OWNER', (papel) => {
    expect(isAgencyManager(papel)).toBe(papel === 'OWNER')
  })

  it.each(roles)('classifica %s como equipe da imobiliária só quando é OWNER ou AGENT', (papel) => {
    expect(isAgencyStaff(papel)).toBe(['OWNER', 'AGENT'].includes(papel))
  })

  it('não confunde o dono da imobiliária com o proprietário do imóvel', () => {
    expect(isPropertyOwner('OWNER')).toBe(false)
    expect(isPropertyOwner('PROPERTY_OWNER')).toBe(true)
    expect(isAgencyStaff('PROPERTY_OWNER')).toBe(false)
  })
})
