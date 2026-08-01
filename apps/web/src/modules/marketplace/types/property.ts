export type PropertyType =
  | 'Apartamento'
  | 'Casas residenciais'
  | 'Salas comerciais'
  | 'Terrenos e lotes'
  | 'Coberturas'
  | 'Studios'

export type MarketplaceProperty = {
  id: string
  image: string
  location: string
  city: string
  title: string
  description: string
  type: PropertyType
  price: number
  bedrooms: number
  bathrooms: number
  parkingSpaces: number
  area: number
  broker: string
  avatar: string
  isNew?: boolean
  isFeatured?: boolean
  coordinates: {
    latitude: number
    longitude: number
  }
}
