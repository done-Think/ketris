import { describe, expect, it } from 'vitest'

import {
  getMarketplaceNavigationItemIdByPurpose,
  getMarketplaceNavigationItems,
  getPropertyDetailNavigationItemId,
  marketplaceNavigationHrefById,
} from '../../config/navigation'

describe('marketplace navigation config', () => {
  it('marks only the requested item as active', () => {
    const navigationItems = getMarketplaceNavigationItems('brokers')

    expect(navigationItems.find((item) => item.id === 'brokers')).toMatchObject({
      active: true,
      href: marketplaceNavigationHrefById.brokers,
    })
    expect(navigationItems.filter((item) => item.active)).toHaveLength(1)
  })

  it('maps search purposes to navigation ids', () => {
    expect(getMarketplaceNavigationItemIdByPurpose('alugar')).toBe('rent')
    expect(getMarketplaceNavigationItemIdByPurpose('comprar')).toBe('buy')
    expect(getMarketplaceNavigationItemIdByPurpose('unknown')).toBeUndefined()
  })

  it('prioritizes profile origins over property purpose on detail pages', () => {
    expect(
      getPropertyDetailNavigationItemId({
        activePurpose: 'comprar',
        originType: 'broker',
        purpose: 'alugar',
      }),
    ).toBe('brokers')
    expect(getPropertyDetailNavigationItemId({ activePurpose: 'comprar' })).toBe('buy')
    expect(getPropertyDetailNavigationItemId({ purpose: 'alugar' })).toBe('rent')
  })
})
