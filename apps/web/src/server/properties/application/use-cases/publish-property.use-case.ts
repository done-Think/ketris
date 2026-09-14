import { PropertyNotFoundError, PropertyPublishValidationError } from '../../domain/errors'
import type { Property } from '../../domain/property.entity'
import type { PropertyRepository } from '../ports/property-repository.port'

export class PublishPropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: { actorTenantId: string; id: string; publishedAt?: Date }) {
    const property = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!property) {
      throw new PropertyNotFoundError()
    }

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

function getPublishMissingFields(property: Property): string[] {
  const missingFields: string[] = []

  if (!property.titulo.trim()) missingFields.push('titulo')
  if (!property.tipo.trim()) missingFields.push('tipo')
  if (property.valores.valor <= 0) missingFields.push('valor')
  if (!property.endereco) missingFields.push('endereco')
  if (property.midias.length === 0) missingFields.push('midias')

  return missingFields
}
