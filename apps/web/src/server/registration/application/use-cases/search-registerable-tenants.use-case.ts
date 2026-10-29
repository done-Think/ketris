import { RENTER_TENANT_SLUG } from '@server/shared/domain/system-tenants'
import type { SearchRegisterableTenantsInput } from '../../types/use-case-inputs'
import type { SearchRegisterableTenantsOutput } from '../../types/use-case-outputs'
import type { RegistrationRepository } from '../ports/registration-repository.port'

export class SearchRegisterableTenantsUseCase {
  constructor(private readonly accounts: RegistrationRepository) {}
  execute(input: SearchRegisterableTenantsInput): Promise<SearchRegisterableTenantsOutput> {
    return this.accounts.searchByName(input.query, [RENTER_TENANT_SLUG])
  }
}
