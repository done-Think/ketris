import { vi } from 'vitest'

import type { RegistrationRepository } from '../../../application/ports/registration-repository.port'
import type { RegistrationPasswordHasher } from '../../../application/ports/registration-password-hasher.port'
import type { RegistrationTenant } from '../../../types/account'

export const tenant: RegistrationTenant = {
  id: 'tenant-1',
  nome: 'Imobiliária Nova',
  slug: 'imobiliaria-nova',
  accountType: 'AGENCY',
  status: 'ACTIVE',
  createdAt: new Date(),
}
export const account = { id: 'user-1', tenantId: tenant.id, email: 'pessoa@example.test' }
export const details = {
  fullName: 'Pessoa Nova',
  email: account.email,
  password: 'test-password',
  phone: '+5511999999999',
  acceptTerms: true,
}

export function createDeps() {
  const accounts: RegistrationRepository = {
    createTenantWithAdmin: vi.fn().mockResolvedValue({ tenant, user: account }),
    createMember: vi.fn().mockResolvedValue(account),
    findAccountByEmail: vi.fn().mockResolvedValue(null),
    findTenantById: vi.fn().mockResolvedValue(tenant),
    findTenantBySlug: vi.fn().mockResolvedValue(tenant),
    searchByName: vi.fn().mockResolvedValue([tenant]),
  }
  const passwords: RegistrationPasswordHasher = { hash: vi.fn().mockResolvedValue('test-hash') }
  return { accounts, passwords }
}
