import type { PublishPropertyInput } from '../../types/use-case-inputs'

import { assertCanEditProperties, assertPropertyAccess } from '../authorization'
import { PropertyNotFoundError, PropertyPublishValidationError } from '../../domain/errors'
import { getPublishMissingFields } from '../../domain/property-publication'
import type { PropertyRepository } from '../ports/property-repository.port'

export class PublishPropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: PublishPropertyInput) {
    assertCanEditProperties(input.actorPapel)

    const property = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!property) {
      throw new PropertyNotFoundError()
    }

    assertPropertyAccess(property, input.actorId, input.actorPapel)

    const missingFields = getPublishMissingFields(property)

    if (missingFields.length > 0) {
      throw new PropertyPublishValidationError(missingFields)
    }

    const publishedProperty = await this.propertyRepository.setStatus(
      input.actorTenantId,
      input.id,
      'PUBLISHED',
      input.publishedAt ?? new Date(),
    )

    if (!publishedProperty) {
      throw new PropertyNotFoundError()
    }

    return publishedProperty
  }
}
