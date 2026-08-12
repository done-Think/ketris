import type { PropertyCardData } from '@shared/types'

export type MarketplacePropertyDetail = PropertyCardData & {
  id: string
  category: string
  condominium: string
  gallery: string[]
  description: string
  address: string
  mapCenter: {
    latitude: number
    longitude: number
  }
  brokerPhone: string
  brokerEmail: string
}

export type PropertyDetailPageProps = {
  property: MarketplacePropertyDetail
}

export type PropertyDetailMapProps = {
  latitude: number
  longitude: number
}
