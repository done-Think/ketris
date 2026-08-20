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
  activePurpose?: string
  breadcrumbContext?: {
    originHref?: string
    originName?: string
    originType?: string
    purpose?: string
  }
}

export type PropertyDetailMapProps = {
  latitude: number
  longitude: number
}

export type PropertyGalleryProps = {
  property: MarketplacePropertyDetail
  onOpenPhoto: (photoIndex: number) => void
}

export type PropertyOverviewProps = {
  property: MarketplacePropertyDetail
}

export type PropertyContactCardProps = {
  property: MarketplacePropertyDetail
}

export type PropertyPhotoDialogProps = {
  activePhotoIndex: number
  onClose: () => void
  onNextPhoto: () => void
  onPreviousPhoto: () => void
  onSelectPhoto: (photoIndex: number) => void
  open: boolean
  property: MarketplacePropertyDetail
}
