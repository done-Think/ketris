import type { GetPropertyInput } from '../../types/use-case-inputs'
import { isAgencyStaff, isPropertyOwner } from '@server/auth/domain/roles'

import { assertPropertyAccess } from '../authorization'
import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'

export class GetPropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: GetPropertyInput) {
    const property = await this.propertyRepository.findByTenantAndId(
      input.actorTenantId,
      input.id,
      input.actorRole === 'RENTER' ? input.actorId : undefined,
      input.actorRole === 'PROPERTY_OWNER' ? input.actorId : undefined,
    )

    if (!property) {
      throw new PropertyNotFoundError()
    }

    if (isAgencyStaff(input.actorRole) || isPropertyOwner(input.actorRole)) {
      assertPropertyAccess(property, input.actorId, input.actorRole)
    }

    return input.actorRole === 'RENTER' ? { ...property, activeContractId: null } : property
  }
}
