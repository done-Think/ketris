import type { TenantSummary } from '../../domain/tenant-summary.entity'
import type { TenantRepository } from '../ports/tenant-repository.port'

export type ListTenantsOutput = TenantSummary[]

export class ListTenantsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(): Promise<ListTenantsOutput> {
    return this.tenantRepository.findMany()
  }
}
