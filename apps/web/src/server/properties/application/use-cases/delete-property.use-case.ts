import type { DeletePropertyInput } from '../../types/use-case-inputs'

import { assertCanEditProperties, assertPropertyAccess } from '../authorization'
import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'

export class DeletePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: DeletePropertyInput) {
    assertCanEditProperties(input.actorPapel)

    const existing = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!existing) {
      throw new PropertyNotFoundError()
    }

    assertPropertyAccess(existing, input.actorId, input.actorPapel)

    const deleted = await this.propertyRepository.setStatus(
      input.actorTenantId,
      input.id,
      'INACTIVE',
      existing.publicadoEm,
    )

    if (!deleted) {
      throw new PropertyNotFoundError()
    }
  }
}
