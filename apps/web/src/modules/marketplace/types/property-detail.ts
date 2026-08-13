import type { PropertyCardData } from '@shared/types'
import type { SearchResultPurpose } from './search'

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
  activePurpose?: SearchResultPurpose
}

export type PropertyPageProps = {
  params: {
    id: string
  }
  searchParams?: {
    finalidade?: string
  }
}

export type PropertyDetailMapProps = {
  latitude: number
  longitude: number
}
