import type {
  PropertySearchFilters,
  PropertySearchPage,
  PropertySearchResult,
  PublicPropertyRepository,
} from '../ports/public-property-repository.port'

export type SearchPropertiesInput = PropertySearchFilters & PropertySearchPage

export type SearchPropertiesOutput = PropertySearchResult & PropertySearchPage

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
