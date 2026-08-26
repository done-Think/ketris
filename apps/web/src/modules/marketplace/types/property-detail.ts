import type { PropertyCardData } from '@shared/types'
import type { LocalizedHref } from '@shared/types/localized-href'

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

export type PropertyBreadcrumbPurpose = 'alugar' | 'comprar'

export type PropertyBreadcrumbOriginType = 'agency' | 'broker'

export type PropertyBreadcrumbContext = {
  originHref?: LocalizedHref
  originName?: string
  originType?: PropertyBreadcrumbOriginType
  purpose?: PropertyBreadcrumbPurpose
}

export type PropertyBreadcrumbsProps = {
  context?: PropertyBreadcrumbContext
  location: string
  propertyTitle: string
}

export type PropertyDetailPageProps = {
  property: MarketplacePropertyDetail
  activePurpose?: PropertyBreadcrumbPurpose
  breadcrumbContext?: PropertyBreadcrumbContext
}

export type PropertyPageSearchParams = {
  purpose?: string
  source?: string
  sourceHref?: string
  sourceName?: string
}

export type PropertyPageProps = {
  params: {
    id: string
  }
  searchParams?: PropertyPageSearchParams
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
