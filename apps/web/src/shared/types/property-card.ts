export type PropertyFeatureKey = 'bedrooms' | 'bathrooms' | 'parking' | 'area'

export type PropertyCardData = {
  href: string
  image: string
  location: string
  title: string
  price: string
  details: Array<{
    key: PropertyFeatureKey
    label: string
  }>
  broker: string
  avatar: string
}
