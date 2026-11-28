import { RENTER_TENANT_SLUG } from '@server/shared/domain/system-tenants'
import type { SearchRegisterableTenantsInput } from '../../types/use-case-inputs'
import type { SearchRegisterableTenantsOutput } from '../../types/use-case-outputs'
import type { RegistrationRepository } from '../ports/registration-repository.port'

const MIN_SEARCH_CHARACTERS = 2

export class SearchRegisterableTenantsUseCase {
  constructor(private readonly accounts: RegistrationRepository) {}
  async execute(input: SearchRegisterableTenantsInput): Promise<SearchRegisterableTenantsOutput> {
    const query = input.query.trim()
    if (query.replace(/\s/g, '').length < MIN_SEARCH_CHARACTERS) return []
    return this.accounts.searchByName(query, [RENTER_TENANT_SLUG])
  }
}
