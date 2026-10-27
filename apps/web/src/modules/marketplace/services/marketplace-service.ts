import { BaseService } from '@shared/lib/api/base-service'

import type {
  ListPropertiesResponse,
  PropertyDetailResponse,
  PublicPropertyDetail,
  SearchPropertiesFilters,
  SubmitInquiryPayload,
  SubmitInquiryResponse,
  SubmitInquiryResult,
} from '../types/public-property'

export class MarketplaceService extends BaseService {
  private readonly propertiesPath = '/marketplace/properties'

  searchProperties(filters: SearchPropertiesFilters = {}): Promise<ListPropertiesResponse> {
    const params = {
      ...(filters.purpose ? { purpose: filters.purpose } : {}),
      ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
      ...(filters.location ? { location: filters.location } : {}),
      ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
      ...(filters.minBedrooms ? { minBedrooms: filters.minBedrooms } : {}),
      ...(filters.minArea ? { minArea: filters.minArea } : {}),
      ...(filters.hasParking ? { hasParking: 'true' } : {}),
      ...(filters.sortBy ? { sortBy: filters.sortBy } : {}),
      ...(filters.page ? { page: filters.page } : {}),
      ...(filters.pageSize ? { pageSize: filters.pageSize } : {}),
    }

    return this.http.get<ListPropertiesResponse>(this.propertiesPath, { params })
  }

  getById(id: string): Promise<PublicPropertyDetail> {
    return this.http
      .get<PropertyDetailResponse>(`${this.propertiesPath}/${id}`)
      .then((data) => data.property)
  }

  submitInquiry(propertyId: string, payload: SubmitInquiryPayload): Promise<SubmitInquiryResult> {
    return this.http
      .post<SubmitInquiryResponse>(`${this.propertiesPath}/${propertyId}/inquiries`, payload)
      .then((data) => data.inquiry)
  }
}

export const marketplaceService = new MarketplaceService()
