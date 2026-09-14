import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'

export class GetPropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: { actorTenantId: string; id: string }) {
    const property = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!property) {
      throw new PropertyNotFoundError()
    }

    return property
  }
}
