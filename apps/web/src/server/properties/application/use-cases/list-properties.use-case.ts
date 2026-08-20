import type { PropertyListFilters } from '../../domain/property.entity'
import type { PropertyRepository } from '../ports/property-repository.port'

export class ListPropertiesUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  execute(input: Omit<PropertyListFilters, 'tenantId'> & { actorTenantId: string }) {
    return this.propertyRepository.list({
      tenantId: input.actorTenantId,
      status: input.status,
      finalidade: input.finalidade,
    })
  }
}
