import type { SearchResultPurpose } from './search'

export type PropertyDetailsLinkSource = {
  href: string
  price: string
}

export type BuildPropertyDetailsHrefParams = {
  href: string
  purpose: SearchResultPurpose
}
