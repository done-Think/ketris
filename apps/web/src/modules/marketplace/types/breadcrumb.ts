import type { LocalizedHref } from '@shared/types/localized-href'

export type MarketplaceBreadcrumbItem = {
  href?: LocalizedHref
  label: string
}

export type MarketplaceBreadcrumbsProps = {
  items: MarketplaceBreadcrumbItem[]
}
