import type { FooterColumn } from '../types/footer'
import type {
  MarketplaceNavigationItem,
  MarketplaceNavigationItemId,
  PropertyDetailNavigationParams,
} from '../types/navigation'
import type { SearchResultPurpose } from '../types/search'

export const marketplaceNavigationHrefById = {
  home: '/',
  rent: '/imoveis?finalidade=alugar',
  buy: '/imoveis?finalidade=comprar',
  brokers: '/corretores',
  agencies: '/imobiliarias',
} as const satisfies Record<MarketplaceNavigationItemId, string>

export const marketplaceNavigationIdByPurpose = {
  alugar: 'rent',
  comprar: 'buy',
} as const satisfies Record<SearchResultPurpose, MarketplaceNavigationItemId>

export const marketplaceNavigationIdByOriginType = {
  broker: 'brokers',
  agency: 'agencies',
} as const satisfies Record<string, MarketplaceNavigationItemId>

function isMarketplaceNavigationOriginType(
  originType?: string,
): originType is keyof typeof marketplaceNavigationIdByOriginType {
  return originType === 'broker' || originType === 'agency'
}

export const homeNavigationItems: MarketplaceNavigationItem[] = [
  { id: 'home', label: 'Home', href: marketplaceNavigationHrefById.home },
  { id: 'rent', label: 'Alugar', href: marketplaceNavigationHrefById.rent },
  { id: 'buy', label: 'Comprar', href: marketplaceNavigationHrefById.buy },
  { id: 'brokers', label: 'Corretores', href: marketplaceNavigationHrefById.brokers },
  { id: 'agencies', label: 'Imobiliárias', href: marketplaceNavigationHrefById.agencies },
]

export function getMarketplaceNavigationItems(activeItemId?: MarketplaceNavigationItemId) {
  return homeNavigationItems.map((item) => ({
    ...item,
    active: item.id === activeItemId,
  }))
}

export function getMarketplaceNavigationItemIdByPurpose(purpose?: string) {
  if (purpose === 'alugar' || purpose === 'comprar') {
    return marketplaceNavigationIdByPurpose[purpose]
  }

  return undefined
}

export function getPropertyDetailNavigationItemId({
  activePurpose,
  originType,
  purpose,
}: PropertyDetailNavigationParams) {
  if (isMarketplaceNavigationOriginType(originType)) {
    return marketplaceNavigationIdByOriginType[originType]
  }

  return getMarketplaceNavigationItemIdByPurpose(purpose ?? activePurpose)
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Para você',
    links: [
      { label: 'Buscar imóveis', href: '/imoveis' },
      { label: 'Favoritos', href: '/imoveis' },
      { label: 'Simulador financeiro', href: '/imoveis' },
    ],
  },
  {
    title: 'Corretores',
    links: [
      { label: 'Quero anunciar', href: '/login' },
      { label: 'Portal parceiro', href: '/login' },
      { label: 'Soluções corporativas', href: '/imoveis' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nós', href: '/' },
      { label: 'Contato', href: '/' },
      { label: 'Trabalhe conosco', href: '/' },
    ],
  },
]

export const legalLinks = [
  { label: 'Termos de Uso', href: '/' },
  { label: 'Política de Privacidade', href: '/' },
] as const
