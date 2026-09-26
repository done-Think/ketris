import type { Papel } from '@server/auth/domain/user.entity'

import type { PropertyListFilters } from '../../domain/property.entity'
import type { PropertyRepository } from '../ports/property-repository.port'

export class ListPropertiesUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  execute(
    input: Omit<PropertyListFilters, 'tenantId' | 'responsavelId'> & {
      actorTenantId: string
      actorId: string
      actorPapel: Papel
    },
  ) {
    if (input.actorPapel === 'RENTER') {
      return Promise.resolve([])
    }

    return this.propertyRepository.list({
      tenantId: input.actorTenantId,
      status: input.status,
      finalidade: input.finalidade,
      responsavelId: input.actorPapel === 'AGENT' ? input.actorId : undefined,
    })
  }
}
