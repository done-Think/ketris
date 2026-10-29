import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import type { SearchPropertiesInput, SearchPropertiesOutput } from '../../types/use-case-inputs'

export class SearchPropertiesUseCase {
  constructor(private readonly propertyRepository: PublicPropertyRepository) {}

  async execute({
    page,
    pageSize,
    ...filters
  }: SearchPropertiesInput): Promise<SearchPropertiesOutput> {
    const result = await this.propertyRepository.search(filters, { page, pageSize })

    return { ...result, page, pageSize }
  }
}
