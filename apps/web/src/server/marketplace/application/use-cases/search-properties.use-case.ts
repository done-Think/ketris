import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import type { SearchPropertiesInput, SearchPropertiesOutput } from '../../types/use-case-inputs'
import type { ResolvePublishedPropertyLocationsUseCase } from './resolve-published-property-locations.use-case'

export class SearchPropertiesUseCase {
  constructor(
    private readonly propertyRepository: PublicPropertyRepository,
    private readonly locations?: ResolvePublishedPropertyLocationsUseCase,
  ) {}

  async execute({
    page,
    pageSize,
    ...filters
  }: SearchPropertiesInput): Promise<SearchPropertiesOutput> {
    let result = await this.propertyRepository.search(filters, { page, pageSize })
    const location = await this.locations?.execute(
      result.items
        .filter((item) => item.latitude === null || item.longitude === null)
        .map(({ id }) => id),
    )
    if (location?.changed)
      result = await this.propertyRepository.search(filters, { page, pageSize })

    return {
      ...result,
      page,
      pageSize,
      ...(location?.pending ? { mapLocationsPending: true } : {}),
    }
  }
}
