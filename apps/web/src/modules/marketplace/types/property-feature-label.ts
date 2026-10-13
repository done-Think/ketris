import type { PropertyCardData } from '@shared/types'

export type PropertyFeatureDetail = PropertyCardData['details'][number]

export type PropertyFeatureTranslation = (
  key: 'features.bedrooms' | 'features.bathrooms' | 'features.parking' | 'features.area',
  values: { count: number },
) => string
