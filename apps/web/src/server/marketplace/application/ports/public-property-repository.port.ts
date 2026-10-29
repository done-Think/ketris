import type { PublishedPropertyDetail } from '../../types/property'
import type {
  PropertySearchFilters,
  PropertySearchPage,
  PropertySearchResult,
} from '../../types/property-search'

export interface PublicPropertyRepository {
  search(filters: PropertySearchFilters, page: PropertySearchPage): Promise<PropertySearchResult>
  findPublishedById(id: string): Promise<PublishedPropertyDetail | null>
}
