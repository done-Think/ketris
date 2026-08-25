import { publicMarketplaceText } from '@shared/i18n/pt-br'

import type { FooterColumn } from '../types/footer'
import type {
  MarketplaceNavigationItem,
  MarketplaceNavigationItemId,
  PropertyDetailNavigationParams,
} from '../types/navigation'
import type { SearchResultPurpose } from '../types/search'

const { footer, navigation } = publicMarketplaceText

export const marketplaceNavigationHrefById = {
  home: '/',
  rent: '/imoveis?purpose=alugar',
  buy: '/imoveis?purpose=comprar',
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
  { id: 'home', label: navigation.home, href: marketplaceNavigationHrefById.home },
  { id: 'rent', label: navigation.rent, href: marketplaceNavigationHrefById.rent },
  { id: 'buy', label: navigation.buy, href: marketplaceNavigationHrefById.buy },
  { id: 'brokers', label: navigation.brokers, href: marketplaceNavigationHrefById.brokers },
  { id: 'agencies', label: navigation.agencies, href: marketplaceNavigationHrefById.agencies },
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
    title: footer.columns.forYou,
    links: [
      { label: footer.links.searchProperties, href: '/imoveis' },
      { label: footer.links.favorites, href: '/imoveis' },
      { label: footer.links.financialSimulator, href: '/imoveis' },
    ],
  },
  {
    title: footer.columns.brokers,
    links: [
      { label: footer.links.listProperty, href: '/login' },
      { label: footer.links.partnerPortal, href: '/login' },
      { label: footer.links.corporateSolutions, href: '/imoveis' },
    ],
  },
  {
    title: footer.columns.company,
    links: [
      { label: footer.links.aboutUs, href: '/' },
      { label: footer.links.contact, href: '/' },
      { label: footer.links.workWithUs, href: '/' },
    ],
  },
]

export const legalLinks = [
  { label: footer.links.termsOfUse, href: '/' },
  { label: footer.links.privacyPolicy, href: '/' },
] as const
