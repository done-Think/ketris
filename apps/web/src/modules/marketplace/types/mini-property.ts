import type { LocalizedHref } from '@shared/types/localized-href'

export type MiniMarketplaceProperty = {
  id: string
  href: LocalizedHref
  title: string
  location: string
  image: string | null
}

export type MiniPropertyCardProps = {
  property: MiniMarketplaceProperty
}
