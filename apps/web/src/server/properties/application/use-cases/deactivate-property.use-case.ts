import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'

export class DeactivatePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: { actorTenantId: string; id: string; actorPapel: Papel }) {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar imóveis.')
    }

    const property = await this.propertyRepository.setStatus(
      input.actorTenantId,
      input.id,
      'INACTIVE',
      null,
    )

    if (!property) {
      throw new PropertyNotFoundError()
    }

    return property
  }
}
