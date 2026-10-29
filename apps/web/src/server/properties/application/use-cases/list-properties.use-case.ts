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
      purpose: input.purpose,
      responsibleId: input.actorRole === 'AGENT' ? input.actorId : undefined,
      ...(input.actorRole === 'RENTER' ? { renterId: input.actorId } : {}),
      ...(input.actorRole === 'PROPERTY_OWNER' ? { ownerId: input.actorId } : {}),
    })
    return input.actorRole === 'RENTER'
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
