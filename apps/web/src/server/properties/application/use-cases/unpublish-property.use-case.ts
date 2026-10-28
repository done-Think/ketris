import type { UnpublishPropertyInput } from '../../types/use-case-inputs'

import { assertCanEditProperties, assertPropertyAccess } from '../authorization'
import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'

export class UnpublishPropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: UnpublishPropertyInput) {
    assertCanEditProperties(input.actorRole)

    const existing = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!existing) {
      throw new PropertyNotFoundError()
    }

    assertPropertyAccess(existing, input.actorId, input.actorRole)

    const property = await this.propertyRepository.setStatus(
      input.actorTenantId,
      input.id,
      'INACTIVE',
      existing.publishedAt,
      input.actorId,
    )

    if (!property) {
      throw new PropertyNotFoundError()
    }

    return property
  }
}
