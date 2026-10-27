import { chargePlatformTenants } from '../../domain/platform-tenant.entity'
import type { ChargedTenantPage, TenantListQuery } from '../../types/tenant-list'
import type { PlatformPlanRepository } from '../ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'

export class ListTenantsUseCase {
  constructor(
    private readonly platformTenantRepository: PlatformTenantRepository,
    private readonly platformPlanRepository: PlatformPlanRepository,
  ) {}

  async execute(query: TenantListQuery): Promise<ChargedTenantPage> {
    const [page, statusCounts, plans] = await Promise.all([
      this.platformTenantRepository.findPage(query),
      this.platformTenantRepository.countByStatus({ q: query.q, accountType: query.accountType }),
      this.platformPlanRepository.findAll(),
    ])
    const usage = await this.platformTenantRepository.countUsage(
      page.items.map((tenant) => tenant.id),
    )

    return {
      items: chargePlatformTenants(page.items, plans, usage),
      totalCount: page.totalCount,
      page: query.page,
      pageSize: query.pageSize,
      statusCounts,
    }
  }
}
