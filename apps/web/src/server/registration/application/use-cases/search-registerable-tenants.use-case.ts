import type { TenantSummary } from '@server/platform/domain/tenant-summary.entity'
import type { TenantRepository } from '@server/platform/application/ports/tenant-repository.port'

import { RENTER_TENANT_SLUG } from './register-renter.use-case'

export interface SearchRegisterableTenantsInput {
  query: string
}

export type SearchRegisterableTenantsOutput = TenantSummary[]

export class SearchRegisterableTenantsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  execute(input: SearchRegisterableTenantsInput): Promise<SearchRegisterableTenantsOutput> {
    return this.tenantRepository.searchByName(input.query, [RENTER_TENANT_SLUG])
  }
}
