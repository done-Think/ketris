import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import { assertPropertyAccess } from '../authorization'
import { PropertyHasLinkedRecordsError, PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'

export class DeletePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: { actorTenantId: string; actorId: string; id: string; actorPapel: Papel }) {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar imóveis.')
    }

    const existing = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!existing) {
      throw new PropertyNotFoundError()
    }

    assertPropertyAccess(existing.responsavelId, input.actorId, input.actorPapel)

    const hasLinkedRecords = await this.propertyRepository.hasLinkedRecords(
      input.actorTenantId,
      input.id,
    )

    if (hasLinkedRecords) {
      throw new PropertyHasLinkedRecordsError()
    }

    const deleted = await this.propertyRepository.delete(input.actorTenantId, input.id)

    if (!deleted) {
      throw new PropertyNotFoundError()
    }
  }
}
