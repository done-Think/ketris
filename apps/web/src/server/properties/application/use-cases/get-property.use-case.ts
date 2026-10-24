import { isAgencyStaff, isPropertyOwner } from '@server/auth/domain/roles'
import type { Papel } from '@server/auth/domain/user.entity'

import { assertPropertyAccess } from '../authorization'
import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'

export class GetPropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: { actorTenantId: string; actorId: string; actorPapel: Papel; id: string }) {
    const property = await this.propertyRepository.findByTenantAndId(
      input.actorTenantId,
      input.id,
      input.actorPapel === 'RENTER' ? input.actorId : undefined,
      input.actorPapel === 'PROPERTY_OWNER' ? input.actorId : undefined,
    )

    if (!property) {
      throw new PropertyNotFoundError()
    }

    if (isAgencyStaff(input.actorPapel) || isPropertyOwner(input.actorPapel)) {
      assertPropertyAccess(property, input.actorId, input.actorPapel)
    }

    return property
  }
}
