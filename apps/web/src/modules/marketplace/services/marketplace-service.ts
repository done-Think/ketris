import { BaseService } from '@shared/lib/api/base-service'

import type { PublicPropertySummary, SearchPropertiesFilters } from '../types/public-property'

interface ListPropertiesResponse {
  properties: PublicPropertySummary[]
}

export class MarketplaceService extends BaseService {
  private readonly propertiesPath = '/marketplace/properties'

  searchProperties(filters: SearchPropertiesFilters = {}): Promise<PublicPropertySummary[]> {
    const params = {
      ...(filters.purpose ? { purpose: filters.purpose } : {}),
      ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
      ...(filters.location ? { location: filters.location } : {}),
      ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
      ...(filters.minBedrooms ? { minBedrooms: filters.minBedrooms } : {}),
      ...(filters.minArea ? { minArea: filters.minArea } : {}),
      ...(filters.hasParking ? { hasParking: 'true' } : {}),
      ...(filters.sortBy ? { sortBy: filters.sortBy } : {}),
    }

    return this.http
      .get<ListPropertiesResponse>(this.propertiesPath, { params })
      .then((data) => data.properties)
  }
}

export const marketplaceService = new MarketplaceService()
