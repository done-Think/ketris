import type { ContractOpportunityCatalog } from '../ports/contract-opportunity-catalog.port'
import { resolveContractManageScope } from '../../domain/contract-access-rules'
import type { ListContractOpportunitiesInput } from '../../types/contract-opportunity'

export class ListContractOpportunitiesUseCase {
  constructor(private readonly catalog: ContractOpportunityCatalog) {}

  execute(input: ListContractOpportunitiesInput) {
    const scope = resolveContractManageScope(input.actorId, input.actorRole)
    return this.catalog.list({
      tenantId: input.actorTenantId,
      ...scope,
      search: input.search,
      page: input.page,
      pageSize: input.pageSize,
    })
  }
}
