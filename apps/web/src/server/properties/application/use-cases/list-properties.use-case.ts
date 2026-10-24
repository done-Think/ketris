import type { ListPropertiesInput } from '../../types/use-case-inputs'

import type { PropertyRepository } from '../ports/property-repository.port'

export class ListPropertiesUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: ListPropertiesInput) {
    const result = await this.propertyRepository.listPage({
      tenantId: input.actorTenantId,
      ...(input.locale ? { locale: input.locale } : {}),
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 25,
      search: input.search,
      sortBy: input.sortBy ?? 'updatedAt',
      sortOrder: input.sortOrder ?? 'desc',
      status: input.status,
      finalidade: input.finalidade,
      responsavelId: input.actorPapel === 'AGENT' ? input.actorId : undefined,
      ...(input.actorPapel === 'RENTER' ? { renterId: input.actorId } : {}),
      ...(input.actorPapel === 'PROPERTY_OWNER' ? { proprietarioId: input.actorId } : {}),
    })
    return input.actorPapel === 'RENTER'
      ? {
          ...result,
          properties: result.properties.map((property) => ({
            ...property,
            activeContractId: null,
          })),
        }
      : result
  }
}
