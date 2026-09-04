import type {
  BuildPropertyDetailsHrefParams,
  PropertyDetailsLinkSource,
} from '../types/property-details-link'
import type { SearchResultPurpose } from '../types/search'

export function getPropertyPurposeFromPrice(price: string): SearchResultPurpose {
  return price.toLocaleLowerCase('pt-BR').includes('mês') ? 'alugar' : 'comprar'
}

export function buildPropertyDetailsHref({ href, purpose }: BuildPropertyDetailsHrefParams) {
  const params = new URLSearchParams({ purpose })

  return `${href}?${params.toString()}`
}

export function buildPropertyDetailsHrefFromSource({ href, price }: PropertyDetailsLinkSource) {
  return buildPropertyDetailsHref({
    href,
    purpose: getPropertyPurposeFromPrice(price),
  })
}
