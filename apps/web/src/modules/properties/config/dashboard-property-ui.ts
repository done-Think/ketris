import type {
  CreatePropertyStepKey,
  CreateDashboardPropertyFormValues,
  DashboardPropertyDetailTab,
  DashboardPropertyFilterKey,
} from '../types/dashboard-property'

export const dashboardPropertyTabs: DashboardPropertyDetailTab[] = [
  'data',
  'media',
  'values',
  'history',
]

export const createPropertySteps: Array<{ key: CreatePropertyStepKey }> = [
  { key: 'basic' },
  { key: 'address' },
  { key: 'features' },
  { key: 'media' },
  { key: 'values' },
  { key: 'publishing' },
]

export const createPropertyTypeOptions = [
  'apartment',
  'house',
  'studio',
  'penthouse',
  'commercial',
  'loft',
  'other',
] as const

export const createPropertyPurposeOptions = ['RENT', 'SALE'] as const

export const createPropertyFeatureOptions = [
  'furnished',
  'gourmetBalcony',
  'petFriendly',
  'concierge24h',
] as const

export const createPropertyPublishingOptions = [
  'publishAfterReview',
  'allowWhatsappContact',
  'featured',
] as const

export const propertyStatusFilters: Array<{ label: DashboardPropertyFilterKey }> = [
  { label: 'all' },
  { label: 'available' },
  { label: 'rented' },
  { label: 'sold' },
  { label: 'inReview' },
  { label: 'inactive' },
]

export const propertyFormStepFields: Record<
  CreatePropertyStepKey,
  Array<keyof CreateDashboardPropertyFormValues>
> = {
  basic: ['type', 'purpose', 'title', 'description', 'ownerUserId'],
  address: [
    'street',
    'number',
    'complement',
    'neighborhood',
    'city',
    'state',
    'zipCode',
    'latitude',
    'longitude',
  ],
  features: ['bedrooms', 'bathrooms', 'parkingSpaces', 'area', 'features'],
  media: ['media'],
  values: ['mainValue', 'rentalValue', 'condominium', 'iptu', 'negotiationTerm'],
  publishing: ['publishingOptions'],
}
