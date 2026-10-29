import type { components } from '@shared/types/generated/api'
export type PublicPropertyPurpose = components['schemas']['PublicPropertySummary']['purpose']

export type MarketplacePropertyType = components['schemas']['PublicPropertySummary']['propertyType']

export type SearchablePropertyType = Exclude<MarketplacePropertyType, 'OTHER'>

export type PublicPropertySummary = components['schemas']['PublicPropertySummary']

export type ListPropertiesResponse = components['schemas']['SearchPropertiesResponse']

export type PublicPropertyAddress = NonNullable<components['schemas']['PropertyAddress']>

export type PublicPropertyMedia = components['schemas']['PropertyMedia']

export type PublicPropertyDetail = components['schemas']['PublicPropertyDetail']

export type PropertyDetailResponse = components['schemas']['GetPropertyResponse']

export type PropertySortOption = NonNullable<
  components['schemas']['SearchPropertiesQuery']['sortBy']
>

export type SearchPropertiesFilters = Omit<
  components['schemas']['SearchPropertiesQuery'],
  'hasParking'
> & { hasParking?: boolean }

export type SubmitInquiryPayload = components['schemas']['SubmitInquiryRequest']

export type SubmitInquiryResult = components['schemas']['SubmitInquiryResponse']['inquiry']

export type SubmitInquiryResponse = components['schemas']['SubmitInquiryResponse']

export type MarketplaceStats = components['schemas']['MarketplaceStatsResponse']
