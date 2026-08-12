import { PropertyNotFoundError } from '../../domain/errors'
import { toPublicPropertyDetail, type PublicPropertyDetail } from '../../domain/property.entity'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'

export interface GetPropertyInput {
  propertyId: string
}

export type GetPropertyOutput = PublicPropertyDetail

export class GetPropertyUseCase {
  constructor(private readonly propertyRepository: PublicPropertyRepository) {}

  async execute(input: GetPropertyInput): Promise<GetPropertyOutput> {
    const property = await this.propertyRepository.findPublishedById(input.propertyId)

    if (!property) {
      throw new PropertyNotFoundError()
    }

    return toPublicPropertyDetail(property)
  }
}
