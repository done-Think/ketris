import type {
  MarketplaceNavigationItemId,
  MarketplaceNavigationPurposeMap,
  PropertyDetailNavigationParams,
} from '../types/navigation'

export const marketplaceNavigationIdByPurpose = {
  alugar: 'rent',
  comprar: 'buy',
} as const satisfies MarketplaceNavigationPurposeMap

export const marketplaceNavigationIdByOriginType = {
  broker: 'brokers',
  agency: 'agencies',
} as const satisfies Record<string, MarketplaceNavigationItemId>

function isMarketplaceNavigationOriginType(
  originType?: string,
): originType is keyof typeof marketplaceNavigationIdByOriginType {
  return originType === 'broker' || originType === 'agency'
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
