import { describe, expect, it } from 'vitest'

import { isAgencyManager, isAgencyStaff, isPropertyOwner } from '../../domain/roles'
import type { UserRole } from '../../domain/user.entity'

const roles: UserRole[] = ['OWNER', 'AGENT', 'RENTER', 'PROPERTY_OWNER']

describe('papéis de usuário', () => {
  it.each(roles)('classifica %s como gestor da imobiliária só quando é OWNER', (role) => {
    expect(isAgencyManager(role)).toBe(role === 'OWNER')
  })

  it.each(roles)('classifica %s como equipe da imobiliária só quando é OWNER ou AGENT', (role) => {
    expect(isAgencyStaff(role)).toBe(['OWNER', 'AGENT'].includes(role))
  })

  it('não confunde o dono da imobiliária com o proprietário do imóvel', () => {
    expect(isPropertyOwner('OWNER')).toBe(false)
    expect(isPropertyOwner('PROPERTY_OWNER')).toBe(true)
    expect(isAgencyStaff('PROPERTY_OWNER')).toBe(false)
  })
})
