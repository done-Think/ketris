import type { PublishedPropertySummary } from '../../domain/property.entity'
import type {
  PropertySearchFilters,
  PublicPropertyRepository,
} from '../ports/public-property-repository.port'

export type SearchPropertiesInput = PropertySearchFilters

export type SearchPropertiesOutput = PublishedPropertySummary[]

export class SearchPropertiesUseCase {
  constructor(private readonly propertyRepository: PublicPropertyRepository) {}

  async execute(input: SearchPropertiesInput): Promise<SearchPropertiesOutput> {
    return this.propertyRepository.search(input)
  }
}
