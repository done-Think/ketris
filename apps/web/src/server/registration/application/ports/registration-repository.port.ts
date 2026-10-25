import type {
  NewRegistrationMember,
  NewTenantWithAdmin,
  RegistrationAccount,
  RegistrationTenant,
} from '../../types/account'

export type { NewTenantWithAdmin } from '../../types/account'

export interface RegistrationRepository {
  createTenantWithAdmin(
    input: NewTenantWithAdmin,
  ): Promise<{ tenant: RegistrationTenant; user: RegistrationAccount }>
  createMember(input: NewRegistrationMember): Promise<RegistrationAccount>
  findAccountByEmail(tenantId: string, email: string): Promise<RegistrationAccount | null>
  findTenantById(id: string): Promise<RegistrationTenant | null>
  findTenantBySlug(slug: string): Promise<RegistrationTenant | null>
  searchByName(query: string, excludeSlugs: string[]): Promise<RegistrationTenant[]>
}
